
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, Edit, Code, BrainCircuit, Star } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { UserData, Submission, Challenge } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { BulletCoin } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { ProfileStats } from '@/components/profile-stats';
import { Separator } from '@/components/ui/separator';

type LanguageStats = { [key: string]: number };
type SkillStats = {
    Fundamental: { [key: string]: number };
    Intermediate: { [key: string]: number };
    Advanced: { [key: string]: number };
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [isLoading, setIsLoading] = useState(true);

  // New state for profile stats
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [attemptedChallenges, setAttemptedChallenges] = useState<string[]>([]);
  const [languageStats, setLanguageStats] = useState<LanguageStats>({});
  const [skillStats, setSkillStats] = useState<SkillStats>({ Fundamental: {}, Intermediate: {}, Advanced: {} });

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserData;
                    const userEmail = user.email || userData.email;
                    setCurrentUser({ ...userData, uid: user.uid, email: userEmail });
                } else {
                    router.push('/login');
                }
                 setIsLoading(false);
            });
            
            // Fetch all challenges once
            const challengesCollection = collection(db, 'challenges');
            const challengesSnapshot = await getDocs(challengesCollection);
            const challengesList = challengesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
            const challengesMap = challengesList.reduce((acc, c) => ({...acc, [c.id!]: c}), {});
            setAllChallenges(challengesList);
            setChallenges(challengesMap);

            const completedRef = doc(db, `users/${user.uid}/challengeData`, 'completed');
            const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
            
            const unsubscribeCompleted = onSnapshot(completedRef, async (snap) => {
                const completedIds = snap.exists() ? Object.keys(snap.data()) : [];
                setCompletedChallenges(completedIds);
                
                // Process stats when completed challenges are loaded/updated
                if (completedIds.length > 0) {
                    const submissionsRef = collection(db, `users/${user.uid}/submissions`);
                    const q = query(submissionsRef, where('status', '==', 'Accepted'));
                    const acceptedSubmissionsSnapshot = await getDocs(q);
                    
                    const langStats: LanguageStats = {};
                    const skStats: SkillStats = { Fundamental: {}, Intermediate: {}, Advanced: {} };

                    acceptedSubmissionsSnapshot.forEach(subDoc => {
                        const submission = subDoc.data() as Submission;
                        // Language Stats
                        langStats[submission.language] = (langStats[submission.language] || 0) + 1;
                    });
                    
                    completedIds.forEach(id => {
                        const challenge = challengesMap[id];
                        if (!challenge) return;

                        const difficultyMap = {
                            'Easy': 'Fundamental',
                            'Medium': 'Intermediate',
                            'Hard': 'Advanced'
                        } as const;
                        const category = difficultyMap[challenge.difficulty];

                        challenge.tags?.forEach(tag => {
                            skStats[category][tag] = (skStats[category][tag] || 0) + 1;
                        });
                    });

                    setLanguageStats(langStats);
                    setSkillStats(skStats);
                }
            });

            const unsubscribeInProgress = onSnapshot(inProgressRef, (snap) => setAttemptedChallenges(snap.exists() ? Object.keys(snap.data()).filter(k => snap.data()[k] === true) : []));

            // Fetch recent submissions for the table
            const recentSubmissionsRef = collection(db, `users/${user.uid}/submissions`);
            const qRecent = query(recentSubmissionsRef, orderBy('timestamp', 'desc'), limit(5));
            const unsubscribeSubmissions = onSnapshot(qRecent, (querySnapshot) => {
                const subs: Submission[] = [];
                querySnapshot.forEach(doc => {
                    const subData = doc.data() as Submission;
                    subs.push({ ...subData, id: doc.id });
                });
                setSubmissions(subs);
            });

            return () => {
                unsubscribeUser();
                unsubscribeSubmissions();
                unsubscribeCompleted();
                unsubscribeInProgress();
            }
        } else {
            router.push('/login');
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [auth, db, router]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }
  
  if (!currentUser) return null;
  
  const solvedCount = completedChallenges.length;
  const attemptedCount = attemptedChallenges.length;

  const totalChallengesByDifficulty = {
      Easy: allChallenges.filter(c => c.difficulty === 'Easy').length,
      Medium: allChallenges.filter(c => c.difficulty === 'Medium').length,
      Hard: allChallenges.filter(c => c.difficulty === 'Hard').length,
  };

  const solvedByDifficulty = {
      Easy: completedChallenges.filter(id => allChallenges.find(c => c.id === id)?.difficulty === 'Easy').length,
      Medium: completedChallenges.filter(id => allChallenges.find(c => c.id === id)?.difficulty === 'Medium').length,
      Hard: completedChallenges.filter(id => allChallenges.find(c => c.id === id)?.difficulty === 'Hard').length,
  };

  const renderSkillSection = (title: string, color: string, skills: {[key: string]: number}) => (
    <div key={title}>
        <h4 className="flex items-center gap-2 font-semibold">
            <span className={`h-2 w-2 rounded-full ${color}`}></span>
            {title}
        </h4>
        <div className="pl-4 mt-2">
            {Object.keys(skills).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(skills).map(([skill, count]) => (
                        <Badge key={skill} variant="secondary" className="text-sm">
                            {skill} <span className="ml-1.5 text-muted-foreground font-mono">x{count}</span>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
        </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
           <Card>
                <CardHeader className="items-center text-center">
                     <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                        <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
                        <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                    </Avatar>
                    <CardTitle>{currentUser.name}</CardTitle>
                    <CardDescription>{currentUser.studentId}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/profile/edit">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Languages
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {Object.entries(languageStats).length > 0 ? Object.entries(languageStats).map(([lang, count]) => (
                        <div key={lang} className="space-y-2">
                           <div className="flex justify-between items-center">
                                <Badge variant="outline">{lang}</Badge>
                                <p className="text-sm text-muted-foreground">{count} problem{count > 1 ? 's' : ''} solved</p>
                           </div>
                           <Separator />
                        </div>
                     )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No problems solved yet.</p>
                     )}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5" />
                        Skills
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderSkillSection("Advanced", "bg-red-500", skillStats.Advanced)}
                    {renderSkillSection("Intermediate", "bg-yellow-500", skillStats.Intermediate)}
                    {renderSkillSection("Fundamental", "bg-green-500", skillStats.Fundamental)}
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            <ProfileStats 
                solvedCount={solvedCount}
                attemptedCount={attemptedCount}
                totalChallenges={allChallenges.length}
                totalChallengesByDifficulty={totalChallengesByDifficulty}
                solvedByDifficulty={solvedByDifficulty}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                    <CardDescription>Your latest attempts on challenges.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Challenge</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Language</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length > 0 ? submissions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{challenges[sub.challengeId]?.title || 'Unknown Challenge'}</TableCell>
                                    <TableCell>
                                         <Badge variant={sub.status === 'Accepted' ? 'default' : 'destructive'} className={sub.status === 'Accepted' ? 'bg-green-600' : ''}>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{sub.language}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {sub.timestamp ? formatDistanceToNow(sub.timestamp.toDate(), { addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No submissions yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
