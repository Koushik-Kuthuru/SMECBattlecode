
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserData } from '@/lib/types';
import { Trophy, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BulletCoin } from '../icons';

type LeaderboardProps = {
    users: UserData[];
    isLoading: boolean;
}

export function LeaderboardPodium({ users, isLoading }: LeaderboardProps) {
    const podiumUsers = [
        users.find((_, i) => i === 1),
        users.find((_, i) => i === 0),
        users.find((_, i) => i === 2)
    ];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Current leaders in the arena.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-end gap-2 md:gap-4 mb-8 min-h-[260px]">
                        <Skeleton className="h-48 w-1/4 rounded-t-lg" />
                        <Skeleton className="h-64 w-1/3 rounded-t-lg" />
                        <Skeleton className="h-40 w-1/4 rounded-t-lg" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Current leaders in the arena.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-8">
                  <div className="relative flex justify-center items-end gap-2 md:gap-4 min-h-[260px]">
                    <div className="absolute bottom-0 h-36 w-full bg-gradient-to-t from-primary/20 to-transparent" />
                    
                    {podiumUsers[0] && (
                      <div className="relative text-center flex flex-col items-center w-1/4">
                        <Trophy className="h-10 w-10 text-slate-400 mb-2" />
                        <Avatar className="w-20 h-20 border-4 border-slate-400">
                            <AvatarImage src={podiumUsers[0].imageUrl} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                        <h4 className="font-bold mt-2 truncate w-full">{podiumUsers[0].name}</h4>
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                            <BulletCoin className="h-4 w-4 text-primary" />
                            <span>{podiumUsers[0].points.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-100 h-24 w-full rounded-t-lg mt-2 flex items-center justify-center text-3xl font-bold text-slate-500">2</div>
                      </div>
                    )}
                    
                    {podiumUsers[1] && (
                        <div className="relative text-center flex flex-col items-center w-1/3 z-10">
                          <Trophy className="h-12 w-12 text-yellow-400 mb-2" />
                           <Avatar className="w-28 h-28 border-4 border-yellow-400">
                              <AvatarImage src={podiumUsers[1].imageUrl} />
                              <AvatarFallback><UserIcon /></AvatarFallback>
                          </Avatar>
                          <h4 className="font-bold mt-2 truncate w-full">{podiumUsers[1].name}</h4>
                           <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                              <BulletCoin className="h-4 w-4 text-primary" />
                              <span>{podiumUsers[1].points.toLocaleString()}</span>
                          </div>
                          <div className="bg-yellow-100 h-32 w-full rounded-t-lg mt-2 flex items-center justify-center text-4xl font-bold text-yellow-600">1</div>
                      </div>
                    )}

                    {podiumUsers[2] && (
                      <div className="relative text-center flex flex-col items-center w-1/4">
                        <Trophy className="h-8 w-8 text-amber-600 mb-2" />
                        <Avatar className="w-16 h-16 border-4 border-amber-600">
                          <AvatarImage src={podiumUsers[2].imageUrl} />
                          <AvatarFallback><UserIcon /></AvatarFallback>
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
            </CardContent>
        </Card>
    );
}
