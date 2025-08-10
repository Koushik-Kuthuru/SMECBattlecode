
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, collectionGroup, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Challenge } from '@/lib/data';
import { Flame, ListChecks, Users, Wifi } from 'lucide-react';
import { UserData } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type AnalyticsData = {
  totalUsers: number;
  totalChallenges: number;
  activeUsers: number;
  mostSolvedChallenge: string;
};

type ChartData = {
  date: string;
  completions: number;
}[];

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string | number; icon: React.ElementType, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export function AnalyticsDashboard({ users, isLoading: isUsersLoading }: { users: UserData[], isLoading: boolean }) {
  const [analytics, setAnalytics] = useState<Omit<AnalyticsData, 'totalUsers' | 'activeUsers'> | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const db = getFirestore(app);
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.lastSeen && (new Date().getTime() - u.lastSeen.toDate().getTime()) < 5 * 60 * 1000).length;


  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      const challengesSnapshot = await getDocs(collection(db, 'challenges'));
      const totalChallenges = challengesSnapshot.size;
      const challengesMap = new Map<string, string>();
      challengesSnapshot.docs.forEach(doc => {
          challengesMap.set(doc.id, doc.data().title);
      });

       const completedQuery = query(collectionGroup(db, 'challengeData'));
       const unsubscribeCompletions = onSnapshot(completedQuery, (completedSnapshot) => {
            const completionCounts: Record<string, number> = {};
            const completionsByDay: Record<string, number> = {};
            const today = new Date();
            const dateLabels: string[] = [];

            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              completionsByDay[formattedDate] = 0;
              dateLabels.push(formattedDate);
            }

            completedSnapshot.forEach(doc => {
                if (doc.id === 'completed') {
                    const data = doc.data();
                    Object.keys(data).forEach(challengeId => {
                        const completedInfo = data[challengeId];
                        if (completedInfo && completedInfo.completedAt && completedInfo.completedAt instanceof Timestamp) {
                             completionCounts[challengeId] = (completionCounts[challengeId] || 0) + 1;
                             
                             const completedTimestamp = completedInfo.completedAt;
                             const sevenDaysAgo = new Date();
                             sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                             if (completedTimestamp.toDate() >= sevenDaysAgo) {
                                const date = completedTimestamp.toDate();
                                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                if (completionsByDay[formattedDate] !== undefined) {
                                    completionsByDay[formattedDate]++;
                                }
                             }
                        }
                    });
                }
            });

            let mostSolvedId = 'N/A';
            let maxCompletions = 0;
            Object.entries(completionCounts).forEach(([challengeId, count]) => {
                if (count > maxCompletions) {
                    maxCompletions = count;
                    mostSolvedId = challengeId;
                }
            });
            const mostSolvedChallenge = challengesMap.get(mostSolvedId) || 'N/A';
            setAnalytics({ totalChallenges, mostSolvedChallenge });

            const finalChartData = dateLabels.map(date => ({
                date,
                completions: completionsByDay[date] || 0
            }));
            setChartData(finalChartData);
            setIsLoading(false);
       });
       
       return () => {
        unsubscribeCompletions();
       }

    };

    fetchAnalytics().catch(console.error);
  }, [db]);


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isUsersLoading} />
        <StatCard title="Active Users" value={activeUsers} icon={Wifi} isLoading={isUsersLoading} />
        <StatCard title="Total Challenges" value={analytics?.totalChallenges ?? 0} icon={ListChecks} isLoading={isLoading} />
        <StatCard title="Most Solved Challenge" value={analytics?.mostSolvedChallenge ?? 'N/A'} icon={Flame} isLoading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Completion Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {isLoading ? (
                 <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                 </div>
            ) : chartData ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completions" fill="hsl(var(--primary))" name="Completions" />
              </BarChart>
            ) : (
                <div className="flex items-center justify-center h-full">No completion data available.</div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
