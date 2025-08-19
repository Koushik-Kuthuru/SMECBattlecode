
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Clock, Heart, ArrowRight, CheckCircle, RefreshCw, Code } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type Challenge, challenges as initialChallenges } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserData } from '@/lib/types';
import { BulletCoin } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// --- Types from missions page ---
type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type Status = 'All' | 'Completed' | 'In Progress' | 'Not Started';


// --- Contest related types and data ---
type Contest = {
  title: string;
  date: string;
  imageUrl: string;
  aiHint: string;
  startsIn: string;
  isFeatured?: boolean;
};

const contests: Contest[] = [
  {
    title: 'Weekly Contest #12',
    date: 'Sunday 8:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'abstract geometric',
    startsIn: '4d 23h 19m 14s',
    isFeatured: false,
  },
  {
    title: 'Biweekly Contest #8',
    date: 'Saturday 8:00 PM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'digital cube',
    startsIn: '11d 11h 19m 14s',
    isFeatured: false,
  },
   {
    title: 'SMEC Foundation Day Special',
    date: 'October 14th, 9:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'university celebration',
    startsIn: '25d 10h 05m 01s',
    isFeatured: true,
  },
    {
    title: 'Diwali Code Fest',
    date: 'November 1st, 10:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'festival lights',
    startsIn: '42d 12h 15m 31s',
    isFeatured: true,
  },
];

// --- Contest Card Component ---
const ContestCard = ({ contest, large = false }: { contest: Contest, large?: boolean }) => (
    <div className="group relative rounded-lg overflow-hidden cursor-pointer shadow-lg transition-transform duration-300 hover:-translate-y-1">
        <Image
            src={contest.imageUrl}
            alt={contest.title}
            width={600}
            height={400}
            className={cn("w-full object-cover transition-transform duration-300 group-hover:scale-105", large ? 'h-56' : 'h-48')}
            data-ai-hint={contest.aiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-3 right-3 bg-black/30 p-2 rounded-md backdrop-blur-sm">
            <Calendar className="h-5 w-5 text-white/80" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
                <Clock className="h-4 w-4" />
                <span>Starts in {contest.startsIn}</span>
            </div>
            <h3 className={cn("font-bold", large ? "text-xl" : "text-lg")}>{contest.title}</h3>
            <p className="text-sm text-white/80">{contest.date}</p>
        </div>
    </div>
);

// --- Mission Challenge Card Component ---
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
            <CardDescription className="flex items-center gap-4 pt-2 flex-wrap">
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
            </CardDescription>
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


export default function ChallengeArenaPage() {
    // --- State from missions page ---
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

  // --- Logic from missions page ---
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


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-4 md:px-6 py-12">
        
        {/* Hero Section */}
        <section className="text-center py-16 animate-fade-in-up">
            <Trophy className="h-24 w-24 mx-auto text-yellow-400 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                SMEC Battle Code <span className="font-light">Contest</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
                Contest every week. Compete and see your ranking!
            </p>
        </section>

        {/* Upcoming Contests */}
        <section className="mb-16">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contests.filter(c => !c.isFeatured).map(contest => (
                    <ContestCard key={contest.title} contest={contest} large />
                ))}
             </div>
        </section>
        
        {/* Featured Contests */}
        <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Featured Contests</h2>
                 <Button variant="link" className="text-sky-400 hover:text-sky-300">
                    <Heart className="mr-2 h-4 w-4" />
                    Sponsor a Contest
                 </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {contests.filter(c => c.isFeatured).map(contest => (
                     <ContestCard key={contest.title} contest={contest} />
                ))}
            </div>
        </section>

        <Separator className="my-16 bg-slate-700" />
        
        {/* --- Practice Zone Section --- */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-sm mb-8">
              <h2 className="text-2xl font-bold tracking-tight shrink-0">Practice Zone</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status)}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-600 text-white">
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
                    <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-600 text-white">
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
                     <Skeleton className="h-[250px] w-full rounded-xl bg-slate-800" />
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
                  <Skeleton className="h-[250px] w-full rounded-xl bg-slate-800" />
                </div>
              ))}
            </div>
          )}

          {!isChallengesLoading && filteredChallenges.length === 0 && (
            <div className="mt-16 flex flex-col items-center justify-center text-center py-16 bg-slate-800/50 rounded-lg">
                <h3 className="text-2xl font-bold tracking-tight">No Challenges Found</h3>
                <p className="text-slate-400">
                  {difficultyFilter === 'All' && statusFilter === 'All'
                    ? 'It seems there are no challenges available right now.'
                    : `No challenges found for the selected filters.`}
                </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
