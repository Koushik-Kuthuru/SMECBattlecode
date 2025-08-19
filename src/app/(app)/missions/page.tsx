
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { type Challenge, challenges as initialChallenges } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, writeBatch, onSnapshot, query, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserData } from '@/lib/types';
import { ArrowRight, CheckCircle, Code, RefreshCw } from 'lucide-react';
import { BulletCoin } from '@/components/icons';
import { Badge } from '@/components/ui/badge';


type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type Status = 'All' | 'Completed' | 'In Progress' | 'Not Started';

function MissionChallengeCard({ challenge, isCompleted, isInProgress }: { challenge: Challenge; isCompleted: boolean; isInProgress: boolean; }) {
    const difficultyColors = {
        Easy: 'text-green-500 border-green-500/50 bg-green-500/10',
        Medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
        Hard: 'text-red-500 border-red-500/50 bg-red-500/10',
    };

    const getStatusInfo = () => {
        if (isCompleted) {
            return { text: 'Completed', icon: <CheckCircle className="h-4 w-4 text-green-500" />, buttonText: 'View Submission' };
        }
        if (isInProgress) {
            return { text: 'In Progress', icon: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />, buttonText: 'Continue' };
        }
        return { text: 'Not Started', icon: null, buttonText: 'Start Challenge' };
    };

    const { text: statusText, icon: statusIcon, buttonText } = getStatusInfo();


  return (
    <Card className="flex flex-col h-full bg-white/60 backdrop-blur-sm border-slate-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                <Badge variant="outline" className={cn("text-xs whitespace-nowrap", difficultyColors[challenge.difficulty])}>
                    {challenge.difficulty}
                </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-4 pt-2 flex-wrap">
                 <div className="flex items-center gap-1">
                    <BulletCoin className="h-4 w-4 text-primary" />
                    <span>{challenge.points} Points</span>
                 </div>
                  <div className="flex items-center gap-1">
                    <Code className="h-4 w-4 text-sky-500" />
                    <span>{challenge.language}</span>
                 </div>
                 {statusIcon && (
                    <div className="flex items-center gap-1 font-medium">
                        {statusIcon}
                        <span>{statusText}</span>
                    </div>
                 )}
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
                {challenge.description}
            </p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={`/challenge/${challenge.id}`}>
                    {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
  );
}


export default function MissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [displayedChallenges, setDisplayedChallenges] = useState<Challenge[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [inProgressChallenges, setInProgressChallenges] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All');
  const [statusFilter, setStatusFilter] = useState<Status>('All');
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  const ITEMS_PER_PAGE = 9;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setIsLoading(true);
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
      setIsLoading(false);
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
      // Fallback to static data on error
      const challengesWithIds = initialChallenges.map((c, i) => ({...c, id: `fallback-${i}`}));
      setChallenges(challengesWithIds); 
    } finally {
      setIsChallengesLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    if (currentUser) {
        fetchChallenges();
    }
  }, [currentUser, fetchChallenges]);

  const filteredChallenges = useMemo(() => {
    if (!currentUser) return [];

    const languageFilter = currentUser.preferredLanguages && currentUser.preferredLanguages.length > 0;
    
    return challenges.filter(challenge => {
      const difficultyMatch = difficultyFilter === 'All' || challenge.difficulty === difficultyFilter;
      const languageMatch = !languageFilter || (currentUser.preferredLanguages && currentUser.preferredLanguages.includes(challenge.language));
      const isEnabled = challenge.isEnabled !== false; // Default to true if undefined

      const isCompleted = !!completedChallenges[challenge.id!];
      const isInProgress = !!inProgressChallenges[challenge.id!] && !isCompleted;

      const statusMatch = () => {
          switch (statusFilter) {
              case 'Completed':
                  return isCompleted;
              case 'In Progress':
                  return isInProgress;
              case 'Not Started':
                  return !isCompleted && !isInProgress;
              case 'All':
              default:
                  return true;
          }
      };
      
      return difficultyMatch && statusMatch() && languageMatch && isEnabled;
    });
  }, [challenges, difficultyFilter, statusFilter, currentUser, completedChallenges, inProgressChallenges]);

  const loadMoreChallenges = useCallback(() => {
    const nextPage = page + 1;
    const newChallenges = filteredChallenges.slice(0, nextPage * ITEMS_PER_PAGE);
    setDisplayedChallenges(newChallenges);
    setPage(nextPage);
    if(newChallenges.length >= filteredChallenges.length) {
      setHasMore(false);
    }
  }, [page, filteredChallenges]);

  useEffect(() => {
    if (challenges.length > 0) {
        const initialLoad = filteredChallenges.slice(0, ITEMS_PER_PAGE);
        setDisplayedChallenges(initialLoad);
        setPage(1);
        setHasMore(initialLoad.length < filteredChallenges.length);
    }
  }, [filteredChallenges, challenges.length]);


  useEffect(() => {
    if (!hasMore || isLoading || isChallengesLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreChallenges();
        }
      },
      { rootMargin: '200px' }
    );
    
    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoading, isChallengesLoading, loadMoreChallenges]);

  if (isLoading || !currentUser) {
      return (
          <div className="flex h-screen items-center justify-center">
              <div>Loading...</div>
          </div>
      )
  }

  const difficultyFilters: Difficulty[] = ['All', 'Easy', 'Medium', 'Hard'];
  const statusFilters: Status[] = ['All', 'Not Started', 'In Progress', 'Completed'];


  return (
    <div className="flex-1 space-y-8 bg-gradient-to-br from-blue-100/40 via-sky-50/40 to-blue-200/40 -m-8 p-8">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Missions</h2>
        </div>
        
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-background/70 backdrop-blur-sm border shadow-sm">
            <h2 className="text-xl font-bold tracking-tight shrink-0">Your Challenges</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
              </Select>
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
        </div>

        {isChallengesLoading ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {[...Array(6)].map((_, i) => (
                 <div key={`skeleton-initial-${i}`} className="flex flex-col space-y-3">
                   <Skeleton className="h-[250px] w-full rounded-xl" />
                 </div>
               ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedChallenges.map((challenge) => (
                <MissionChallengeCard 
                  key={challenge.id} 
                  challenge={challenge} 
                  isCompleted={!!completedChallenges[challenge.id!]}
                  isInProgress={!!inProgressChallenges[challenge.id!]} 
                />
              ))}
            </div>
        )}
        
        {hasMore && !isChallengesLoading && (
          <div ref={loaderRef} className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={`skeleton-loader-${i}`} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!isChallengesLoading && filteredChallenges.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center py-16 bg-background/50 rounded-lg">
              <h3 className="text-2xl font-bold tracking-tight">No Challenges Found</h3>
              <p className="text-muted-foreground">
                {difficultyFilter === 'All' && statusFilter === 'All'
                  ? 'It seems there are no challenges available right now.'
                  : `No challenges found for the selected filters.`}
              </p>
          </div>
        )}
    </div>
  );
}
