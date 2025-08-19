
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
import { CheckCircle, Circle, RefreshCw, Search, Filter, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserData } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type Status = 'All' | 'Solved' | 'Attempted' | 'Unsolved';

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
  const [statusFilter, setStatusFilter] = useState<Status>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilters, setTopicFilters] = useState<string[]>([]);

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
        const topicMatch = topicFilters.length === 0 || (challenge.tags && challenge.tags.some(tag => topicFilters.includes(tag)));
        
        const isSolved = !!completedChallenges[challenge.id!];
        const isAttempted = !!inProgressChallenges[challenge.id!];
        const statusMatch = 
            statusFilter === 'All' ||
            (statusFilter === 'Solved' && isSolved) ||
            (statusFilter === 'Attempted' && isAttempted && !isSolved) ||
            (statusFilter === 'Unsolved' && !isSolved && !isAttempted);

        const isEnabled = challenge.isEnabled !== false;
        return difficultyMatch && searchMatch && topicMatch && statusMatch && isEnabled;
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
  }, [challenges, difficultyFilter, searchTerm, topicFilters, statusFilter, currentUser, completedChallenges, inProgressChallenges]);

  const allTopicTags = useMemo(() => {
      const allTags = challenges.flatMap(c => c.tags || []);
      return [...new Set(allTags)].slice(0, 10);
  }, [challenges]);

  const handleTopicFilterChange = (tag: string, checked: boolean) => {
    setTopicFilters(prev => 
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    );
  };
  
  const handlePickOne = () => {
    const unsolved = filteredChallenges.filter(c => !completedChallenges[c.id!]);
    if (unsolved.length > 0) {
        const randomChallenge = unsolved[Math.floor(Math.random() * unsolved.length)];
        router.push(`/challenge/${randomChallenge.id}`);
    } else if (filteredChallenges.length > 0) {
        const randomChallenge = filteredChallenges[Math.floor(Math.random() * filteredChallenges.length)];
        router.push(`/challenge/${randomChallenge.id}`);
    } else {
        toast({
            title: 'No Challenges Available',
            description: 'Could not find any challenges to pick from.'
        });
    }
  }

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

  const totalSolved = Object.keys(completedChallenges).length;
  const totalChallenges = challenges.length;
  const solvedPercentage = totalChallenges > 0 ? (totalSolved / totalChallenges) * 100 : 0;

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
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as Difficulty)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Difficulties</SelectItem>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
                <DropdownMenuLabel className="mt-2">Status</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Solved">Solved</SelectItem>
                        <SelectItem value="Attempted">Attempted</SelectItem>
                        <SelectItem value="Unsolved">Unsolved</SelectItem>
                    </SelectContent>
                </Select>
                <DropdownMenuLabel className="mt-2">Topics</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTopicTags.map(tag => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={topicFilters.includes(tag)}
                    onCheckedChange={(checked) => handleTopicFilterChange(tag, !!checked)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
                <Progress value={solvedPercentage} className="w-24 h-2" />
                <span>{totalSolved}/{totalChallenges} Solved</span>
            </div>
            <Button variant="outline" onClick={handlePickOne}>
                <Shuffle className="mr-2 h-4 w-4"/> Pick One
            </Button>
        </div>
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
                       {challenge.tags && challenge.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {challenge.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                            ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">55.8%</TableCell>
                    <TableCell className="text-right">
                      <DifficultyPill difficulty={challenge.difficulty} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No challenges found for the selected filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
