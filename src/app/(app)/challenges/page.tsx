
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
import { getFirestore, doc, getDoc, collection, getDocs, writeBatch, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { type Challenge, challenges as initialChallenges } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Circle, RefreshCw, Search, Filter, Shuffle, Tag, Activity, Code, Plus, Trash2, Book, BrainCircuit, MessageSquare, Code2, Target, Trophy, Icon as LucideIcon, ChevronDown, Star, ArrowUpNarrowWide, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserData, StudyPlan } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { BulletCoin } from '@/components/icons';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';


type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type Status = 'All' | 'Solved' | 'Attempted' | 'Unsolved' | 'Favorites';
type SortBy = 'Default' | 'Difficulty' | 'Points';

const icons: { [key: string]: React.ElementType } = {
  Book,
  BrainCircuit,
  MessageSquare,
  Code2,
  Target,
  Trophy,
};

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

const StudyPlanCard = ({ plan }: { plan: StudyPlan }) => {
    const IconComponent = icons[plan.iconName] || Book;
    return (
      <Card className={cn("h-48 overflow-hidden relative flex flex-col justify-between text-white p-6", `bg-gradient-to-br ${plan.gradient}`)}>
            <div className="relative z-10">
                <h3 className="text-xl font-bold">{plan.title}</h3>
                <p className="text-sm opacity-90">{plan.description}</p>
            </div>
            <Link href={plan.href} className="relative z-10 w-fit">
                <Button variant="secondary" size="sm" className="bg-white/90 text-black hover:bg-white">
                    {plan.buttonText}
                </Button>
            </Link>
            <IconComponent className="absolute right-4 bottom-4 h-20 w-20 text-white/10 z-0" />
      </Card>
    );
};


export default function ChallengesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [inProgressChallenges, setInProgressChallenges] = useState<Record<string, boolean>>({});
  const [favoriteChallenges, setFavoriteChallenges] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [isStudyPlansLoading, setIsStudyPlansLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All');
  const [statusFilter, setStatusFilter] = useState<Status>('All');
  const [sortBy, setSortBy] = useState<SortBy>('Default');
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

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
          
          const challengeDataRef = collection(db, `users/${user.uid}/challengeData`);
          const completedDocRef = doc(challengeDataRef, 'completed');
          const inProgressDocRef = doc(challengeDataRef, 'inProgress');
          const favoritesDocRef = doc(challengeDataRef, 'favorites');

          onSnapshot(completedDocRef, (snap) => setCompletedChallenges(snap.exists() ? snap.data() : {}));
          onSnapshot(inProgressDocRef, (snap) => setInProgressChallenges(snap.exists() ? snap.data() : {}));
          onSnapshot(favoritesDocRef, (snap) => setFavoriteChallenges(snap.exists() ? snap.data() : {}));

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
  
  useEffect(() => {
    setIsStudyPlansLoading(true);
    const plansCollectionRef = collection(db, 'study_plans');
    const q = query(plansCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as StudyPlan))
        .filter(plan => plan.isEnabled);
      setStudyPlans(plansList);
      setIsStudyPlansLoading(false);
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

    return challenges
      .filter(challenge => {
        const difficultyMatch = difficultyFilter === 'All' || challenge.difficulty === difficultyFilter;
        const searchMatch = searchTerm === '' || challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
        const topicMatch = topicFilter === 'All' || (challenge.tags && challenge.tags.includes(topicFilter));
        
        const isSolved = !!completedChallenges[challenge.id!];
        const isAttempted = !!inProgressChallenges[challenge.id!];
        const isFavorite = !!favoriteChallenges[challenge.id!];

        const statusMatch = 
            statusFilter === 'All' ||
            (statusFilter === 'Solved' && isSolved) ||
            (statusFilter === 'Attempted' && isAttempted && !isSolved) ||
            (statusFilter === 'Unsolved' && !isSolved && !isAttempted) ||
            (statusFilter === 'Favorites' && isFavorite);

        const isEnabled = challenge.isEnabled !== false;
        return difficultyMatch && searchMatch && topicMatch && statusMatch && isEnabled;
      })
      .sort((a, b) => {
        if (sortBy === 'Difficulty') {
            const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }
        if (sortBy === 'Points') {
            return b.points - a.points;
        }

        // Default sort
        const aCompleted = !!completedChallenges[a.id!];
        const bCompleted = !!completedChallenges[b.id!];
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        
        const aInProgress = !!inProgressChallenges[a.id!];
        const bInProgress = !!inProgressChallenges[b.id!];
        if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
        
        return 0;
      });
  }, [challenges, difficultyFilter, searchTerm, topicFilter, statusFilter, currentUser, completedChallenges, inProgressChallenges, favoriteChallenges, sortBy]);

  const allTopicTags = useMemo(() => {
      const tagCounts: Record<string, number> = {};
      challenges.forEach(c => {
        c.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      return Object.entries(tagCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([tag]) => tag);
  }, [challenges]);
  
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
  
  const handleFavoriteToggle = async (challengeId: string) => {
    if (!currentUser) return;
    const isFavorited = !!favoriteChallenges[challengeId];
    const newFavorites = { ...favoriteChallenges, [challengeId]: !isFavorited };
    if (isFavorited) {
        delete newFavorites[challengeId];
    }
    setFavoriteChallenges(newFavorites);
    const favoritesDocRef = doc(db, `users/${currentUser.uid}/challengeData`, 'favorites');
    await setDoc(favoritesDocRef, { [challengeId]: !isFavorited }, { merge: true });
  }

  const resetFilters = () => {
    setDifficultyFilter('All');
    setStatusFilter('All');
    setTopicFilter('All');
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
      return <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (inProgressChallenges[challengeId]) {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mx-auto" />;
    }
    return <Circle className="h-5 w-5 text-slate-300 mx-auto" />;
  }

  const totalSolved = Object.keys(completedChallenges).length;
  const totalChallenges = challenges.length;
  const solvedPercentage = totalChallenges > 0 ? (totalSolved / totalChallenges) * 100 : 0;
  
  const displayedTags = isTagsExpanded ? allTopicTags : allTopicTags.slice(0, 5);

  return (
    <div className="space-y-6">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold tracking-tight">Challenges</CardTitle>
        <CardDescription>Hone your skills with our collection of curated problems.</CardDescription>
      </CardHeader>
      
      <div className="hidden md:block space-y-4">
        <h2 className="text-xl font-bold">Study Plans</h2>
        {isStudyPlansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
        ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {studyPlans.map((plan, index) => (
                        <CarouselItem key={plan.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                             <div className="p-1">
                                <StudyPlanCard plan={plan} />
                             </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge
          variant={topicFilter === 'All' ? 'default' : 'secondary'}
          onClick={() => setTopicFilter('All')}
          className="cursor-pointer text-sm"
        >
          All Topics
        </Badge>
        {displayedTags.map(tag => (
          <Badge
            key={tag}
            variant={topicFilter === tag ? 'default' : 'secondary'}
            onClick={() => setTopicFilter(tag)}
            className="cursor-pointer text-sm"
          >
            {tag}
          </Badge>
        ))}
        {allTopicTags.length > 5 && (
            <Button variant="ghost" size="sm" onClick={() => setIsTagsExpanded(!isTagsExpanded)} className="text-sm">
                {isTagsExpanded ? 'Show Less' : 'Show More'}
                <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isTagsExpanded && "rotate-180")} />
            </Button>
        )}
      </div>
      
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
        <div className="flex w-full sm:w-auto items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <DropdownMenuRadioItem value="Default">Default</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Difficulty">Difficulty</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Points">Points</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-sm sm:max-w-md p-4" align="end">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Match All of the following filters:</p>
                        </div>
                        <div className="space-y-3">
                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                <Label className="w-20 shrink-0">Status</Label>
                                <Select value="is">
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="is">is</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Favorites">Favorites</SelectItem>
                                        <SelectItem value="Solved">Solved</SelectItem>
                                        <SelectItem value="Attempted">Attempted</SelectItem>
                                        <SelectItem value="Unsolved">Unsolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Difficulty Filter */}
                            <div className="flex items-center gap-2">
                                <Shuffle className="h-5 w-5 text-muted-foreground" />
                                <Label className="w-20 shrink-0">Difficulty</Label>
                                 <Select value="is">
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="is">is</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as Difficulty)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="ghost" onClick={resetFilters}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
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
                <TableHead className="w-[8%] text-center">Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-center w-[15%]">Difficulty</TableHead>
                <TableHead className="text-center w-[15%] hidden md:table-cell">Solve Rate</TableHead>
                <TableHead className="text-center w-[10%]">Points</TableHead>
                <TableHead className="w-[8%] text-center"><span className="sr-only">Favorite</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isChallengesLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="text-center"><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                    <TableCell className="text-center hidden md:table-cell"><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-1/2 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredChallenges.length > 0 ? (
                filteredChallenges.map((challenge, index) => (
                  <TableRow
                    key={challenge.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      // Prevent navigation if the favorite button was clicked
                      if ((e.target as HTMLElement).closest('button')?.dataset.role === 'favorite-button') {
                        return;
                      }
                      router.push(`/challenge/${challenge.id}`);
                    }}
                  >
                    <TableCell className="text-center">
                      {getStatusIcon(challenge.id!)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        <span>{challenge.title}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <DifficultyPill difficulty={challenge.difficulty} />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm hidden md:table-cell">80%</TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-primary">
                            <BulletCoin className="h-4 w-4" />
                            {challenge.points}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 group"
                        data-role="favorite-button"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row's onClick from firing
                            handleFavoriteToggle(challenge.id!)
                        }}
                      >
                        <Star className={cn(
                          "h-5 w-5 text-slate-300 transition-all duration-300 group-hover:scale-125",
                          favoriteChallenges[challenge.id!] && "fill-yellow-400 text-yellow-400"
                        )} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No challenges found for the selected filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
