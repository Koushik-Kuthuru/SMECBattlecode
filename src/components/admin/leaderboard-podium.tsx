
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserData } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Crown, Medal, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BulletCoin } from "../icons";

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


export function LeaderboardPodium({ users, isLoading }: { users: UserData[], isLoading: boolean }) {
    if (isLoading) {
        return <div className="text-center py-8">Loading leaderboard...</div>;
    }

    const topUsers = users.slice(0, 10);
    const top3 = topUsers.slice(0, 3);
    const others = topUsers.slice(3);

    const podiumDisplayUsers = [
        top3.length > 1 ? top3[1] : undefined, // 2nd place
        top3.length > 0 ? top3[0] : undefined, // 1st place
        top3.length > 2 ? top3[2] : undefined, // 3rd place
    ];

    const getFormattedBranchAndYear = (user: UserData) => {
        const branch = user.branch ? BRANCH_MAP[user.branch] || user.branch : 'N/A';
        const year = user.year ? `${user.year} Year` : 'N/A';
        if(branch === 'N/A' && year === 'N/A') return null;
        return `${branch} - ${year}`;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top 10 performing users.</CardDescription>
            </CardHeader>
            <CardContent>
                {topUsers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No users on the leaderboard yet.
                    </div>
                ) : (
                    <>
                    <div className="flex justify-center items-end gap-2 md:gap-4 mb-8 min-h-[250px]">
                        {/* 2nd Place */}
                        {podiumDisplayUsers[0] && (
                            <div className="text-center flex flex-col items-center w-1/4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                                <Trophy className="h-8 w-8 text-slate-400 mb-2" />
                                <Avatar className="w-20 h-20 border-4 border-slate-400">
                                    <AvatarImage src={podiumDisplayUsers[0]?.imageUrl} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <h4 className="font-bold mt-2 truncate w-full">{podiumDisplayUsers[0]?.name}</h4>
                                <p className="text-xs text-muted-foreground truncate w-full">{getFormattedBranchAndYear(podiumDisplayUsers[0])}</p>
                                <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                                    <BulletCoin className="h-4 w-4 text-primary" />
                                    <span>{podiumDisplayUsers[0]?.points.toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-200 h-24 w-full rounded-t-lg mt-2 flex items-center justify-center text-3xl font-bold text-slate-600">2</div>
                            </div>
                        )}

                        {/* 1st Place */}
                         {podiumDisplayUsers[1] && (
                            <div className="text-center flex flex-col items-center w-1/3 animate-fade-in-up">
                                <Trophy className="h-10 w-10 text-yellow-400 mb-2" />
                                <Avatar className="w-28 h-28 border-4 border-yellow-400">
                                    <AvatarImage src={podiumDisplayUsers[1]?.imageUrl} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <h4 className="font-bold mt-2 truncate w-full">{podiumDisplayUsers[1]?.name}</h4>
                                <p className="text-xs text-muted-foreground truncate w-full">{getFormattedBranchAndYear(podiumDisplayUsers[1])}</p>
                                <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                                    <BulletCoin className="h-4 w-4 text-primary" />
                                    <span>{podiumDisplayUsers[1]?.points.toLocaleString()}</span>
                                </div>
                                <div className="bg-yellow-200 h-32 w-full rounded-t-lg mt-2 flex items-center justify-center text-4xl font-bold text-yellow-700">1</div>
                            </div>
                        )}
                        
                        {/* 3rd Place */}
                        {podiumDisplayUsers[2] && (
                           <div className="text-center flex flex-col items-center w-1/4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                                <Trophy className="h-8 w-8 text-amber-600 mb-2" />
                                <Avatar className="w-20 h-20 border-4 border-amber-600">
                                    <AvatarImage src={podiumDisplayUsers[2]?.imageUrl} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <h4 className="font-bold mt-2 truncate w-full">{podiumDisplayUsers[2]?.name}</h4>
                                <p className="text-xs text-muted-foreground truncate w-full">{getFormattedBranchAndYear(podiumDisplayUsers[2])}</p>
                                <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                                    <BulletCoin className="h-4 w-4 text-primary" />
                                    <span>{podiumDisplayUsers[2]?.points.toLocaleString()}</span>
                                </div>
                                <div className="bg-amber-200 h-20 w-full rounded-t-lg mt-2 flex items-center justify-center text-2xl font-bold text-amber-800">3</div>
                            </div>
                        )}
                    </div>
                    </>
                )}
                
                {others.length > 0 && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {others.map((user, index) => (
                                <TableRow key={user.uid}>
                                    <TableCell className="font-bold text-center">{index + 4}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.imageUrl} />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{getFormattedBranchAndYear(user)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end font-semibold gap-1">
                                            <BulletCoin className="h-4 w-4 text-primary" />
                                            <span>{user.points.toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

            </CardContent>
        </Card>
    )
}
