
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, KeyRound, Search, AlertTriangle, Download, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFirestore, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserData as AppUserData } from '@/lib/types';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';


type UserData = Omit<AppUserData, 'lastSeen' | 'branch'> & {
    lastSeen?: Timestamp;
    branch: string; // branch is required here, unlike the partial from lib
    isAdmin?: boolean;
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

const ITEMS_PER_PAGE = 10;

export default function ManageUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [firestoreError, setFirestoreError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
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
                    branch: data.branch,
                    year: data.year ? `${data.year} Year` : 'N/A',
                    imageUrl: data.imageUrl,
                    lastSeen: data.lastSeen,
                    profileComplete: data.profileComplete,
                    section: data.section,
                    isAdmin: data.isAdmin,
                } as UserData;
            }).filter(user => !user.isAdmin);
            setUsers(usersList);
            setIsLoading(false);
            setFirestoreError(null);
        }, (error) => {
            console.error("Error fetching users: ", error);
            if (error.code === 'unavailable') {
                const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || app.options.projectId;
                setFirestoreError(`Could not connect to Firestore. This usually means the database has not been created yet. Please visit https://console.cloud.google.com/firestore/databases?project=${projectId} to create one.`);
            } else {
                setFirestoreError('An unknown error occurred while fetching user data.');
            }
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
            (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.studentId || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


    const handleDownload = () => {
        const dataToExport = filteredUsers.map(user => ({
            Name: user.name,
            Email: user.email,
            'Student ID': user.studentId,
            Branch: user.branch ? BRANCH_MAP[user.branch] || user.branch : 'N/A',
            Year: user.year,
            Section: user.section || 'N/A',
            'Total Points': user.points,
            'Last Seen': user.lastSeen ? user.lastSeen.toDate().toLocaleString() : 'Never',
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, "SMECBattleCode_Users.xlsx");
    };

    return (
        <div className="container mx-auto py-8">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Manage Users</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button disabled={isLoading || users.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Data
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Data Download</DialogTitle>
                            <DialogDescription>
                                This will download an Excel sheet with the following data for all filtered users.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
                                <li>Name</li>
                                <li>Email</li>
                                <li>Student ID</li>
                                <li>Branch</li>
                                <li>Year</li>
                                <li>Section</li>
                                <li>Total Points</li>
                                <li>Last Seen</li>
                            </ul>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
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
                    ) : firestoreError ? (
                        <div className="text-center py-16 text-destructive flex flex-col items-center gap-4">
                            <AlertTriangle className="h-10 w-10" />
                            <p className="font-semibold text-lg">Firestore Connection Error</p>
                            <p className="max-w-md">{firestoreError}</p>
                        </div>
                    ) : paginatedUsers.length > 0 ? (
                        <>
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
                                {paginatedUsers.map(user => (
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
                                            <p>{user.branch ? BRANCH_MAP[user.branch] || user.branch : 'N/A'}</p>
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
                        <Pagination 
                            page={currentPage}
                            totalPages={totalPages}
                            setPage={setCurrentPage}
                        />
                        </>
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
