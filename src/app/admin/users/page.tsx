
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, KeyRound, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';

type UserData = {
    email: string;
    name: string;
    studentId: string;
    points: number;
    branch: string;
    year: string;
    // Password is not stored or displayed in admin panel for security
    imageUrl?: string;
};

const BRANCH_MAP: Record<string, string> = {
    cse: 'CSE',
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
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const usersCollection = collection(db, 'users');
                const q = query(usersCollection, orderBy('points', 'desc'));
                const querySnapshot = await getDocs(q);

                const usersList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        email: data.email,
                        name: data.name,
                        studentId: data.studentId,
                        points: data.points || 0,
                        branch: data.branch ? BRANCH_MAP[data.branch] || data.branch : 'N/A',
                        year: data.year ? `${data.year} Year` : 'N/A',
                        imageUrl: data.imageUrl,
                    };
                });
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [db]);

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentId.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.email}>
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
