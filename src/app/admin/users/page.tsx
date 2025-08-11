
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, KeyRound, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserData as AppUserData } from '@/lib/types';


type UserData = Omit<AppUserData, 'lastSeen' | 'branch'> & {
    lastSeen?: Timestamp;
    branch: string; // branch is required here, unlike the partial from lib
};


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

export default function ManageUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const db = getFirestore(app);

    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('points', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    email: data.email,
                    name: data.name,
                    studentId: data.studentId,
                    points: data.points || 0,
                    branch: data.branch ? BRANCH_MAP[data.branch] || data.branch : 'N/A',
                    year: data.year ? `${data.year} Year` : 'N/A',
                    imageUrl: data.imageUrl,
                    lastSeen: data.lastSeen,
                    profileComplete: data.profileComplete,
                    section: data.section,
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

    const isOnline = (lastSeen?: Timestamp) => {
        if (!lastSeen) return false;
        // 5 minutes threshold
        return (new Date().getTime() - lastSeen.toDate().getTime()) < 5 * 60 * 1000;
    };

    const filteredUsers = users.filter(user => 
        !user.isAdmin && (
            (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.studentId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
            
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-16">Loading users...</div>
                    ) : filteredUsers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Branch & Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Seen</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage src={user.imageUrl} alt={user.name} />
                                                    <AvatarFallback><User /></AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.studentId}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p>{user.branch}</p>
                                            <p className="text-sm text-muted-foreground">{user.year}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("h-2.5 w-2.5 rounded-full", isOnline(user.lastSeen) ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                                                <span>{isOnline(user.lastSeen) ? 'Online' : 'Offline'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.lastSeen ? formatDistanceToNow(user.lastSeen.toDate(), { addSuffix: true }) : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{user.points}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>{searchTerm ? 'No users found matching your search.' : 'No users have registered yet.'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
