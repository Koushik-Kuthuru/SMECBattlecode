
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { type Challenge, challenges as initialChallenges } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Circle, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserData } from '@/lib/types';


type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

const DifficultyPill = ({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) => {
  const difficultyStyles = {
    Easy: 'text-green-600 bg-green-100',
    Medium: 'text-yellow-600 bg-yellow-100',
    Hard: 'text-red-600 bg-red-100',
  };
  return (
    <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', difficultyStyles[difficulty])}>
      {difficulty}
    </span>
  );
};


export default function ChallengesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [inProgressChallenges, setInProgressChallenges] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');

  const auth = getAuth(app);
  const db = getFirestore(app);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setIsUserLoading(true);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          setCurrentUser({ ...userData, uid: user.uid, email: user.email! });

          const completedChallengesSnap = await getDoc(doc(db, `users/${user.uid}/challengeData/completed`));
          setCompletedChallenges(completedChallengesSnap.exists() ? completedChallengesSnap.data() : {});
          
          const inProgressChallengesSnap = await getDoc(doc(db, `users/${user.uid}/challengeData/inProgress`));
          setInProgressChallenges(inProgressChallengesSnap.exists() ? inProgressChallengesSnap.data() : {});
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);
  
  const fetchChallenges = useCallback(async () => {
    setIsChallengesLoading(true);
    try {
      const challengesCollection = collection(db, 'challenges');
      let challengesSnapshot = await getDocs(challengesCollection);

      if (challengesSnapshot.empty) {
          console.log("No challenges found, seeding initial data...");
          const batch = writeBatch(db);
          initialChallenges.forEach(challengeData => {
              const challengeRef = doc(collection(db, 'challenges'));
              batch.set(challengeRef, { ...challengeData, id: challengeRef.id });
          });
          await batch.commit();
          
          challengesSnapshot = await getDocs(challengesCollection); // Re-fetch after seeding
          toast({
            title: 'Welcome!',
            description: 'Initial challenges have been loaded for you.'
          });
      }
      
      const challengesList = challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
      setChallenges(challengesList);

    } catch (error) {
      console.error("Error fetching challenges: ", error);
      toast({
        variant: 'destructive',
        title: 'Error fetching challenges',
        description: 'Could not load challenges. Please try again later.'
      });
      const challengesWithIds = initialChallenges.map((c, i) => ({...c, id: `fallback-${i}`}));
      setChallenges(challengesWithIds); 
    } finally {
      setIsChallengesLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    if (!isUserLoading && currentUser) {
        fetchChallenges();
    }
  }, [isUserLoading, currentUser, fetchChallenges]);

  const filteredChallenges = useMemo(() => {
    if (!currentUser) return [];

    return challenges
      .filter(challenge => {
        const difficultyMatch = difficultyFilter === 'All' || challenge.difficulty === difficultyFilter;
        const searchMatch = searchTerm === '' || challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
        const topicMatch = topicFilter === 'All' || (challenge.tags && challenge.tags.includes(topicFilter));
        const isEnabled = challenge.isEnabled !== false;
        return difficultyMatch && searchMatch && topicMatch && isEnabled;
      })
      .sort((a, b) => {
          const aCompleted = !!completedChallenges[a.id!];
          const bCompleted = !!completedChallenges[b.id!];
          if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
          
          const aInProgress = !!inProgressChallenges[a.id!];
          const bInProgress = !!inProgressChallenges[b.id!];
          if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
          
          return 0;
      });
  }, [challenges, difficultyFilter, searchTerm, topicFilter, currentUser, completedChallenges, inProgressChallenges]);

  const topicTags = useMemo(() => {
      const allTags = challenges.flatMap(c => c.tags || []);
      return [...new Set(allTags)].slice(0, 10);
  }, [challenges]);


  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
      </div>
    )
  }

  const getStatusIcon = (challengeId: string) => {
    if (completedChallenges[challengeId]) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (inProgressChallenges[challengeId]) {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    return <Circle className="h-5 w-5 text-slate-300" />;
  }

  return (
    <div className="space-y-6">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold tracking-tight">Challenge Arena</CardTitle>
        <CardDescription>Hone your skills with our collection of curated problems.</CardDescription>
      </CardHeader>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search challenges..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as Difficulty)}>
          <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="All">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
          <Button variant={topicFilter === 'All' ? 'secondary' : 'outline'} size="sm" onClick={() => setTopicFilter('All')}>All</Button>
          {topicTags.map(tag => (
              <Button key={tag} variant={topicFilter === tag ? 'secondary' : 'outline'} size="sm" className="bg-background" onClick={() => setTopicFilter(tag)}>{tag}</Button>
          ))}
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-center">Acceptance</TableHead>
                <TableHead className="text-right">Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isChallengesLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredChallenges.length > 0 ? (
                filteredChallenges.map(challenge => (
                  <TableRow key={challenge.id}>
                    <TableCell className="text-center">
                      {getStatusIcon(challenge.id!)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/challenge/${challenge.id}`} className="font-medium hover:underline">
                        {challenge.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">55.8%</TableCell>
                    <TableCell className="text-right">
                      <DifficultyPill difficulty={challenge.difficulty} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No challenges found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
