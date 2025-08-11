
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Info, ShieldCheck, Trophy, User, CheckCircle } from 'lucide-react';
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { BulletCoin } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

const BRANCH_MAP: Record<string, string> = {
    cse: 'CSE',
    csd: 'CSE (Data Science)',
    cse_aiml: 'CSE (AI & ML)',
    aiml: 'AI & Machine Learning',
    aids: 'AI & Data Science',
    it: 'Info. Tech.',
    ece: 'ECE',
    eee: 'EEE',
    mech: 'Mechanical',
    civil: 'Civil',
};

type LeaderboardEntry = {
  rank: number;
  uid: string;
  name: string;
  points: number;
  email: string;
  imageUrl?: string;
  branch?: string;
  year?: string;
};

const getFormattedBranchAndYear = (user: LeaderboardEntry) => {
    const branch = user.branch ? BRANCH_MAP[user.branch] || user.branch : null;
    const year = user.year ? `${user.year} Year` : null;
    if (!branch && !year) return 'SMEC';
    if (!year) return branch;
    if (!branch) return year;
    return `${branch} - ${year}`;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(app);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('points', 'desc'));
        const querySnapshot = await getDocs(q);

        const sortedUsers: LeaderboardEntry[] = querySnapshot.docs
            .filter(doc => !doc.data().isAdmin)
            .map((doc, index) => {
              const data = doc.data();
              return {
                rank: index + 1,
                uid: doc.id,
                name: data.name,
                points: data.points || 0,
                email: data.email,
                imageUrl: data.imageUrl,
                branch: data.branch,
                year: data.year,
              };
            });
        setLeaderboardData(sortedUsers);
      } catch (error) {
        console.error("Error fetching leaderboard: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [db]);

  const podiumUsers = [
      leaderboardData.find(u => u.rank === 2),
      leaderboardData.find(u => u.rank === 1),
      leaderboardData.find(u => u.rank === 3)
  ];
  
  const otherUsers = leaderboardData.slice(3);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
             <CardTitle className="text-3xl font-bold tracking-tight">Leaderboard</CardTitle>
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="icon">
                               <Info className="h-5 w-5 text-muted-foreground" />
                         </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <BulletCoin className="h-6 w-6 text-primary" />
                             Scoring System
                          </DialogTitle>
                          <DialogDescription>
                            Understand how to climb the ranks and earn points.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Points are awarded for each correctly solved challenge. Your code must pass all test cases. The points depend on the challenge difficulty.
                                </p>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Difficulty</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong className="text-green-500">Easy</strong></TableCell>
                                            <TableCell className="text-right font-bold">10</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong className="text-yellow-500">Medium</strong></TableCell>
                                            <TableCell className="text-right font-bold">25</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong className="text-red-500">Hard</strong></TableCell>
                                            <TableCell className="text-right font-bold">50</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                             <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    First-Time Completion
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    You only earn points the first time you solve a challenge. Resubmitting won't grant more points.
                                </p>
                            </div>

                             <div className="space-y-2 rounded-lg border border-destructive/50 p-3 bg-destructive/10">
                                <h3 className="font-semibold flex items-center gap-2 text-sm text-destructive">
                                    <ShieldCheck className="h-4 w-4" />
                                    Tab-Switching Penalty
                                </h3>
                                <p className="text-xs text-destructive/90">
                                    Navigating away from the challenge page during a challenge will result in a point penalty. Focus and integrity are key!
                                </p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
          </div>
          <CardDescription>See who is at the top of the SMEC Battle Code arena.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-end gap-2 md:gap-4 mb-8 min-h-[260px]">
                <Skeleton className="h-48 w-1/4 rounded-t-lg" />
                <Skeleton className="h-64 w-1/3 rounded-t-lg" />
                <Skeleton className="h-40 w-1/4 rounded-t-lg" />
             </div>
          ) : leaderboardData.length > 0 ? (
            <div className="mb-8">
              <div className="relative flex justify-center items-end gap-2 md:gap-4 min-h-[260px]">
                {/* Podium Backgrounds */}
                <div className="absolute bottom-0 h-36 w-full bg-gradient-to-t from-primary/20 to-transparent" />
                
                {/* 2nd Place */}
                {podiumUsers[0] && (
                  <div className="relative text-center flex flex-col items-center w-1/4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <Trophy className="h-10 w-10 text-slate-400 mb-2" />
                    <Avatar className="w-20 h-20 border-4 border-slate-400">
                        <AvatarImage src={podiumUsers[0].imageUrl} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <h4 className="font-bold mt-2 truncate w-full">{podiumUsers[0].name}</h4>
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <BulletCoin className="h-4 w-4 text-primary" />
                        <span>{podiumUsers[0].points.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-100 h-24 w-full rounded-t-lg mt-2 flex items-center justify-center text-3xl font-bold text-slate-500">2</div>
                  </div>
                )}
                
                {/* 1st Place */}
                {podiumUsers[1] && (
                    <div className="relative text-center flex flex-col items-center w-1/3 z-10 animate-fade-in-up">
                      <Trophy className="h-12 w-12 text-yellow-400 mb-2" />
                       <Avatar className="w-28 h-28 border-4 border-yellow-400">
                          <AvatarImage src={podiumUsers[1].imageUrl} />
                          <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                      <h4 className="font-bold mt-2 truncate w-full">{podiumUsers[1].name}</h4>
                       <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                          <BulletCoin className="h-4 w-4 text-primary" />
                          <span>{podiumUsers[1].points.toLocaleString()}</span>
                      </div>
                      <div className="bg-yellow-100 h-32 w-full rounded-t-lg mt-2 flex items-center justify-center text-4xl font-bold text-yellow-600">1</div>
                  </div>
                )}

                {/* 3rd Place */}
                {podiumUsers[2] && (
                  <div className="relative text-center flex flex-col items-center w-1/4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <Trophy className="h-8 w-8 text-amber-600 mb-2" />
                    <Avatar className="w-16 h-16 border-4 border-amber-600">
                      <AvatarImage src={podiumUsers[2].imageUrl} />
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <h4 className="font-bold mt-2 truncate w-full">{podiumUsers[2].name}</h4>
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <BulletCoin className="h-4 w-4 text-primary" />
                        <span>{podiumUsers[2].points.toLocaleString()}</span>
                    </div>
                    <div className="bg-amber-100 h-20 w-full rounded-t-lg mt-2 flex items-center justify-center text-2xl font-bold text-amber-800">3</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
             <div className="text-center text-muted-foreground py-16">
              <h3 className="text-xl font-semibold">The leaderboard is empty.</h3>
              <p>Complete some challenges to get on the board!</p>
            </div>
          )}
          
           {/* Leaderboard Table */}
            <div className="mt-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Branch & Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((user) => (
                    <TableRow key={user.uid} className={cn(currentUser?.uid === user.uid && 'bg-primary/10 hover:bg-primary/20')}>
                      <TableCell className="font-bold">{user.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Avatar className="w-8 h-8">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback><User /></AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end font-semibold gap-1">
                            <BulletCoin className="h-4 w-4 text-primary" />
                            <span>{user.points.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {getFormattedBranchAndYear(user)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
