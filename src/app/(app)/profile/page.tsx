
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, Edit } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { UserData, Submission, Challenge } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { BulletCoin } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [isLoading, setIsLoading] = useState(true);

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

            // Fetch recent submissions
            const submissionsRef = collection(db, `users/${user.uid}/submissions`);
            const q = query(submissionsRef, orderBy('timestamp', 'desc'), limit(5));
            const unsubscribeSubmissions = onSnapshot(q, async (querySnapshot) => {
                const subs: Submission[] = [];
                const challengeIds = new Set<string>();

                querySnapshot.forEach(doc => {
                    const subData = doc.data() as Submission;
                    subs.push({ ...subData, id: doc.id });
                    if(subData.challengeId) challengeIds.add(subData.challengeId);
                });
                
                // Fetch challenge details for the submissions
                if(challengeIds.size > 0) {
                    const challengesData: Record<string, Challenge> = {};
                    for (const id of Array.from(challengeIds)) {
                         const challengeDoc = await getDoc(doc(db, 'challenges', id));
                         if(challengeDoc.exists()) {
                            challengesData[id] = challengeDoc.data() as Challenge;
                         }
                    }
                    setChallenges(challengesData);
                }
                setSubmissions(subs);
            });

            return () => {
                unsubscribeUser();
                unsubscribeSubmissions();
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
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Your performance at a glance.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <BulletCoin className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                            <p className="text-2xl font-bold">{currentUser.points}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Challenges Solved</p>
                            <p className="text-2xl font-bold">{Object.keys(submissions).length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
