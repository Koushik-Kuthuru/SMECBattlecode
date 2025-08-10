
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserData } from '@/lib/types';
import { differenceInHours } from 'date-fns';
import { Users, UserCheck, Activity, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

type AnalyticsProps = {
    users: UserData[];
    isLoading: boolean;
}

export function AnalyticsDashboard({ users, isLoading }: AnalyticsProps) {
    const stats = useMemo(() => {
        if (!users) return { total: 0, active24h: 0, avgPoints: 0, completionRate: 0 };
        const totalUsers = users.length;
        const now = new Date();
        const activeUsers = users.filter(u => u.lastSeen && differenceInHours(now, u.lastSeen.toDate()) <= 24).length;
        const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
        const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
        
        return {
            total: totalUsers,
            active24h: activeUsers,
            avgPoints: averagePoints,
        };
    }, [users]);
    
    const analyticsCards = [
        { title: 'Total Users', value: stats.total, icon: Users },
        { title: 'Active (24h)', value: stats.active24h, icon: UserCheck },
        { title: 'Avg. Points', value: stats.avgPoints, icon: Activity },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {analyticsCards.map((card, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                           <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
