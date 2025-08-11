
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { type Challenge, challenges as initialChallenges } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc, addDoc, writeBatch, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import { UserData, Event } from '@/lib/types';
import { ArrowRight, Badge as BadgeIcon, Calendar, CheckCircle, Circle, Flame, RefreshCw, Trophy, User, Wifi } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BulletCoin } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Advertisement = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonLink: string;
  buttonText: string;
  isEnabled: boolean;
}

type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

const ChallengeListItem = ({ challenge, isCompleted, isInProgress, isLast }: { challenge: Challenge, isCompleted: boolean, isInProgress: boolean, isLast: boolean }) => {
  const difficultyColors = {
    Easy: 'text-green-500 border-green-500/50 bg-green-500/10',
    Medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
    Hard: 'text-red-500 border-red-500/50 bg-red-500/10',
  };

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (isInProgress) {
      return <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />;
    }
    return <Circle className="h-6 w-6 text-slate-300" />;
  }

  return (
    <Link href={`/challenge/${challenge.id}`} className="group block">
        <div className="flex items-center gap-4 py-4 px-2 rounded-lg transition-colors hover:bg-muted/50">
           <div className="relative flex flex-col items-center">
                {getStatusIcon()}
                {!isLast && <div className="absolute top-8 left-1/2 h-full w-0.5 -translate-x-1/2 bg-slate-200" />}
           </div>
           <div className="flex-1">
                <p className="font-semibold">{challenge.title}</p>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline" className={cn("text-xs", difficultyColors[challenge.difficulty])}>{challenge.difficulty}</Badge>
                    <div className="flex items-center gap-1">
                        <BulletCoin className="h-4 w-4 text-primary" />
                        <span>{challenge.points} Points</span>
                    </div>
                </div>
           </div>
           <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
    </Link>
  );
};


export default function DashboardPage() {
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
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userToChase, setUserToChase] = useState<UserData | null>(null);
  const [todaysPoints, setTodaysPoints] = useState(0);
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  const ITEMS_PER_PAGE = 10;
   const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setIsUserLoading(true);
      if (user) {
        // User document listener
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            if (!userData.profileComplete) {
                router.push('/complete-profile');
                return;
            }
            setCurrentUser({ ...userData, uid: user.uid, email: user.email! });
          } else {
             router.push('/login');
          }
        });

        // Today's points listener
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dailyPointsRef = doc(db, `users/${user.uid}/daily_points`, today);
        const unsubscribePoints = onSnapshot(dailyPointsRef, (docSnap) => {
            setTodaysPoints(docSnap.exists() ? docSnap.data().points : 0);
        });

        // Challenge status listeners
        const completedChallengesSnap = await getDoc(doc(db, `users/${user.uid}/challengeData/completed`));
        setCompletedChallenges(completedChallengesSnap.exists() ? completedChallengesSnap.data() : {});
        const inProgressChallengesSnap = await getDoc(doc(db, `users/${user.uid}/challengeData/inProgress`));
        setInProgressChallenges(inProgressChallengesSnap.exists() ? inProgressChallengesSnap.data() : {});

        // Leaderboard listener
        const usersQuery = query(collection(db, 'users'), orderBy('points', 'desc'));
        const unsubscribeLeaderboard = onSnapshot(usersQuery, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserData));
            const currentUserIndex = allUsers.findIndex(u => u.uid === user.uid);

            if (currentUserIndex !== -1) {
                const rank = currentUserIndex + 1;
                setUserRank(rank);

                if (rank > 1) {
                    const userToChaseData = allUsers[currentUserIndex - 1];
                    setUserToChase(userToChaseData);
                } else {
                    setUserToChase(null); // User is #1
                }
            } else {
                 setUserRank(null);
                 setUserToChase(null);
            }
        });

        setIsUserLoading(false);

        return () => {
          unsubscribeUser();
          unsubscribeLeaderboard();
          unsubscribePoints();
        }
      } else {
        router.push('/login');
        setIsUserLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);
  
  // Real-time listener for advertisements
  useEffect(() => {
    const adsCollectionRef = collection(db, 'advertisements');
    const q = query(adsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Advertisement))
        .filter(ad => ad.isEnabled);
      setAdvertisements(adsList);
    });
    return () => unsubscribe();
  }, [db]);

  // Real-time listener for events
  useEffect(() => {
    const eventsCollectionRef = collection(db, 'events');
    const q = query(eventsCollectionRef, orderBy('startDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let liveCount = 0;
        let upcomingCount = 0;
        const now = new Date();

        snapshot.docs.forEach(doc => {
            const event = doc.data() as Event;
            if (event.isEnabled) {
                const startDate = event.startDate.toDate();
                const endDate = event.endDate.toDate();
                if (startDate <= now && endDate >= now) {
                    liveCount++;
                } else if (startDate > now) {
                    upcomingCount++;
                }
            }
        });
        setLiveEventsCount(liveCount);
        setUpcomingEventsCount(upcomingCount);
    });
    return () => unsubscribe();
  }, [db]);


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
    
    const languageFilter = currentUser.preferredLanguages && currentUser.preferredLanguages.length > 0;

    return challenges.filter(challenge => {
        const difficultyMatch = difficultyFilter === 'All' || challenge.difficulty === difficultyFilter;
        const languageMatch = !languageFilter || currentUser.preferredLanguages!.some(lang => challenge.language === lang);
        const isEnabled = challenge.isEnabled !== false; // Default to true if undefined
        return difficultyMatch && languageMatch && isEnabled;
    }).sort((a, b) => {
        const aCompleted = !!completedChallenges[a.id!];
        const bCompleted = !!completedChallenges[b.id!];
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        
        const aInProgress = !!inProgressChallenges[a.id!];
        const bInProgress = !!inProgressChallenges[b.id!];
        if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
        
        return 0;
    });
  }, [challenges, difficultyFilter, currentUser, completedChallenges, inProgressChallenges]);

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
    if (challenges.length > 0 && !isUserLoading) {
        const initialLoad = filteredChallenges.slice(0, ITEMS_PER_PAGE);
        setDisplayedChallenges(initialLoad);
        setPage(1);
        setHasMore(initialLoad.length < filteredChallenges.length);
    }
  }, [filteredChallenges, challenges.length, isUserLoading]);

  useEffect(() => {
    if (!hasMore || isUserLoading || isChallengesLoading) return;
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
  }, [hasMore, isUserLoading, isChallengesLoading, loadMoreChallenges]);

  const isLoading = isUserLoading || (isChallengesLoading && challenges.length === 0);

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <div>Loading...</div>
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between space-y-2 md:hidden">
            <h2 className="text-3xl font-bold tracking-tight">Welcome {currentUser?.name.split(' ')[0]} 👋</h2>
        </div>
        <div className="hidden md:flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome {currentUser?.name} 👋</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {advertisements.length > 0 && (
              <Carousel
                plugins={[autoplay.current]}
                onMouseEnter={autoplay.current.stop}
                onMouseLeave={autoplay.current.reset}
                className="w-full"
                opts={{ loop: true }}
              >
                <CarouselContent>
                  {advertisements.map((ad) => (
                    <CarouselItem key={ad.id}>
                      <Card className="bg-slate-900 text-white border-0 overflow-hidden">
                        <CardContent className="p-0 flex flex-col md:flex-row items-stretch justify-between gap-0 h-64">
                           <div className="w-full md:w-1/2 h-full">
                              <img src={ad.imageUrl || 'https://placehold.co/600x400.png'} alt={ad.title} className="w-full h-full object-cover" data-ai-hint="advertisement event" />
                            </div>
                          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
                              <h3 className="text-xl md:text-2xl font-bold leading-tight">{ad.title}</h3>
                              <p className="text-muted-foreground text-white/80 text-sm md:text-base mt-2">{ad.description}</p>
                              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto mt-6">
                                <Link href={ad.buttonLink || '#'} target="_blank" rel="noopener noreferrer">
                                  {ad.buttonText || 'Learn More'}
                                </Link>
                              </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 hidden md:flex" />
                <CarouselNext className="right-4 hidden md:flex" />
              </Carousel>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle>Your Challenges</CardTitle>
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
                </CardHeader>
                <CardContent>
                    {isChallengesLoading && challenges.length === 0 ? (
                        <div className="space-y-4">
                           {[...Array(6)].map((_, i) => (
                             <div key={`skeleton-initial-${i}`} className="flex items-center gap-4">
                               <Skeleton className="h-8 w-8 rounded-full" />
                               <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-4/5" />
                                 <Skeleton className="h-4 w-2/5" />
                               </div>
                             </div>
                           ))}
                         </div>
                    ) : (
                        <div>
                          {displayedChallenges.map((challenge, index) => (
                             <ChallengeListItem
                              key={challenge.id}
                              challenge={challenge}
                              isCompleted={!!completedChallenges[challenge.id!]}
                              isInProgress={!!inProgressChallenges[challenge.id!]}
                              isLast={index === displayedChallenges.length - 1}
                            />
                          ))}
                        </div>
                    )}
                    
                    {hasMore && !isChallengesLoading && (
                       <div ref={loaderRef} className="mt-8 space-y-4">
                        {[...Array(2)].map((_, i) => (
                           <div key={`skeleton-loader-${i}`} className="flex items-center gap-4">
                               <Skeleton className="h-8 w-8 rounded-full" />
                               <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-4/5" />
                                 <Skeleton className="h-4 w-2/5" />
                               </div>
                             </div>
                        ))}
                      </div>
                    )}

                    {!isChallengesLoading && filteredChallenges.length === 0 && (
                      <div className="mt-16 flex flex-col items-center justify-center text-center">
                          <h3 className="text-2xl font-bold tracking-tight">No Challenges Found</h3>
                          <p className="text-muted-foreground">
                            {difficultyFilter === 'All'
                              ? 'It seems there are no challenges available right now.'
                              : `No ${difficultyFilter.toLowerCase()} challenges found for your preferred languages.`}
                          </p>
                      </div>
                    )}
                </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            <Card className="bg-white border border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Events</span>
                         <Link href="/events" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                            View <ArrowRight className="h-4 w-4" />
                        </Link>
                    </CardTitle>
                    <CardDescription>Challenges, podcasts & a lot more activities!</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-semibold">Live Now: {liveEventsCount}</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold">Upcoming: {upcomingEventsCount}</span>
                    </div>
                </CardContent>
            </Card>

             <Card className="bg-white border border-slate-200 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Leaderboard</span>
                         <Link href="/leaderboard" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                            View <ArrowRight className="h-4 w-4" />
                        </Link>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                        <AvatarImage src={currentUser?.imageUrl} />
                        <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold">{currentUser?.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-primary font-semibold mb-4">
                        <BulletCoin className="h-5 w-5" />
                        <span>{currentUser?.points ?? 0}</span>
                    </div>

                    <div className="bg-slate-100 py-4 rounded-b-lg -m-6 mt-6 border-t">
                        <p className="text-slate-800 font-bold text-5xl">#{userRank ?? 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-semibold tracking-widest">RANK</p>
                    </div>
                    {userToChase && (
                         <div className="text-sm text-center bg-muted p-2 rounded-lg mt-4">
                            <p>You are chasing <span className="font-semibold">{userToChase.name}</span> with {userToChase.points} points! 🔥</p>
                         </div>
                    )}
                </CardContent>
            </Card>

             <Card className="bg-white border border-slate-200">
                <CardHeader>
                    <CardTitle>Mission Report</CardTitle>
                    <CardDescription>Your performance summary.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Points Today</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Flame className="h-6 w-6 text-orange-500" />
                                <span className="text-2xl font-bold">{todaysPoints}</span>
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                         <div>
                            <p className="text-sm text-muted-foreground">Lifetime Points</p>
                             <div className="flex items-center justify-center gap-2 mt-1">
                                <BulletCoin className="h-6 w-6 text-primary" />
                                <span className="text-2xl font-bold">{currentUser?.points ?? 0}</span>
                            </div>
                        </div>
                   </div>
                </CardContent>
            </Card>

          </aside>
        </div>
    </div>
  );
}
