
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, collectionGroup, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Challenge } from '@/lib/data';
import { Flame, ListChecks, Users, Wifi } from 'lucide-react';
import { UserData } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, subMonths, format } from 'date-fns';

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

type TimeRange = '7d' | '30d' | '12m';

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
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

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
            const completionsByPeriod: Record<string, number> = {};
            
            const today = new Date();
            let dateLabels: string[] = [];
            let startDate: Date;

            if (timeRange === '7d') {
                startDate = subDays(today, 6);
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(today, i);
                    dateLabels.push(format(date, 'MMM d'));
                }
            } else if (timeRange === '30d') {
                startDate = subDays(today, 29);
                for (let i = 29; i >= 0; i--) {
                    const date = subDays(today, i);
                    dateLabels.push(format(date, 'MMM d'));
                }
            } else { // 12m
                startDate = subMonths(today, 11);
                startDate.setDate(1); // Start from beginning of the month
                for (let i = 11; i >= 0; i--) {
                    const date = subMonths(today, i);
                    dateLabels.push(format(date, 'MMM yyyy'));
                }
            }
            
            dateLabels.forEach(label => completionsByPeriod[label] = 0);

            completedSnapshot.forEach(doc => {
                if (doc.id === 'completed') {
                    const data = doc.data();
                    Object.keys(data).forEach(challengeId => {
                        const completedInfo = data[challengeId];
                        if (completedInfo && completedInfo.completedAt && completedInfo.completedAt instanceof Timestamp) {
                             completionCounts[challengeId] = (completionCounts[challengeId] || 0) + 1;
                             
                             const completedDate = completedInfo.completedAt.toDate();
                             if (completedDate >= startDate) {
                                let formattedDate: string;
                                if(timeRange === '12m') {
                                    formattedDate = format(completedDate, 'MMM yyyy');
                                } else {
                                    formattedDate = format(completedDate, 'MMM d');
                                }
                                
                                if (completionsByPeriod[formattedDate] !== undefined) {
                                    completionsByPeriod[formattedDate]++;
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
                completions: completionsByPeriod[date] || 0
            }));
            setChartData(finalChartData);
            setIsLoading(false);
       });
       
       return () => {
        unsubscribeCompletions();
       }

    };

    fetchAnalytics().catch(console.error);
  }, [db, timeRange]);


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} isLoading={isUsersLoading} />
        <StatCard title="Active Users" value={activeUsers} icon={Wifi} isLoading={isUsersLoading} />
        <StatCard title="Total Challenges" value={analytics?.totalChallenges ?? 0} icon={ListChecks} isLoading={isLoading} />
        <StatCard title="Most Solved Challenge" value={analytics?.mostSolvedChallenge ?? 'N/A'} icon={Flame} isLoading={isLoading} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Challenge Completion Trends</CardTitle>
            <CardDescription>
                {timeRange === '7d' && 'Completions in the last 7 days.'}
                {timeRange === '30d' && 'Completions in the last 30 days.'}
                {timeRange === '12m' && 'Completions in the last 12 months.'}
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="12m">Monthly (1 Year)</SelectItem>
            </SelectContent>
          </Select>
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
