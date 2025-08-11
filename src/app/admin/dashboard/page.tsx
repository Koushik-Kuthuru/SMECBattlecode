
'use client';

import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { LeaderboardPodium } from '@/components/admin/leaderboard-podium';
import { app } from '@/lib/firebase';
import { UserData } from '@/lib/types';
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';


export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('points', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const usersList: UserData[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                email: data.email,
                name: data.name,
                studentId: data.studentId,
                points: data.points || 0,
                branch: data.branch,
                year: data.year,
                section: data.section,
                imageUrl: data.imageUrl,
                lastSeen: data.lastSeen as Timestamp,
                profileComplete: data.profileComplete,
                preferredLanguages: data.preferredLanguages,
                isAdmin: data.isAdmin
            } as UserData;
        }).filter(user => !user.isAdmin);
        setUsers(usersList);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching users: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <div className="space-y-8">
        <AnalyticsDashboard users={users} isLoading={isLoading} />
        <LeaderboardPodium users={users} isLoading={isLoading} />
      </div>
    </div>
  );
}
