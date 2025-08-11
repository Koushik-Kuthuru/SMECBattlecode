
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Eye, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { CodeEditor } from '../code-editor';
import { getFirestore, collection, collectionGroup, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { compareCode } from '@/ai/flows/compare-code';
import { Challenge } from '@/lib/data';
import { UserData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


type Submission = {
    userId: string;
    userName: string;
    challengeId: string;
    code: string;
    language: string;
};

type SuspiciousActivity = {
    challenge: string;
    challengeId: string;
    users: { id: string, name: string }[];
    similarity: number;
    timestamp: string;
    code: { [key: string]: string };
    language: string;
};

export function CheatingDetection() {
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 95) return 'text-red-600';
    if (similarity > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const runDetection = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch all challenges and users
            const challengesSnapshot = await getDocs(collection(db, 'challenges'));
            const challenges: Record<string, Challenge> = {};
            challengesSnapshot.forEach(doc => challenges[doc.id] = { id: doc.id, ...doc.data() } as Challenge);

            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users: Record<string, UserData> = {};
            usersSnapshot.forEach(doc => users[doc.id] = { uid: doc.id, ...doc.data() } as UserData);

            // 2. Fetch all solutions
            const solutionsSnapshot = await getDocs(collectionGroup(db, 'solutions'));
            const solutionsByChallenge: Record<string, Submission[]> = {};

            solutionsSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const pathParts = docSnap.ref.path.split('/');
                const userId = pathParts[1];
                const challengeId = pathParts[3];

                if (!solutionsByChallenge[challengeId]) {
                    solutionsByChallenge[challengeId] = [];
                }
                solutionsByChallenge[challengeId].push({
                    userId,
                    userName: users[userId]?.name || 'Unknown User',
                    challengeId,
                    code: data.code,
                    language: data.language,
                });
            });

            // 3. Compare solutions and find suspicious ones
            const detectedActivities: SuspiciousActivity[] = [];
            for (const challengeId in solutionsByChallenge) {
                const submissions = solutionsByChallenge[challengeId];
                if (submissions.length < 2) continue;

                for (let i = 0; i < submissions.length; i++) {
                    for (let j = i + 1; j < submissions.length; j++) {
                        const subA = submissions[i];
                        const subB = submissions[j];

                        // Simple check to avoid comparing identical code or empty snippets
                        if (subA.code === subB.code || !subA.code || !subB.code) continue;

                        try {
                            const result = await compareCode({
                                code1: subA.code,
                                code2: subB.code,
                                language: subA.language,
                            });
                            
                            if (result.similarity > 90) { // Threshold for suspicion
                                detectedActivities.push({
                                    challenge: challenges[challengeId]?.title || 'Unknown Challenge',
                                    challengeId,
                                    users: [{ id: subA.userId, name: subA.userName }, { id: subB.userId, name: subB.userName }],
                                    similarity: result.similarity,
                                    timestamp: new Date().toISOString(),
                                    code: {
                                        [subA.userName]: subA.code,
                                        [subB.userName]: subB.code,
                                    },
                                    language: subA.language,
                                });
                            }
                        } catch (aiError) {
                            console.error(`AI comparison failed for challenge ${challengeId}`, aiError);
                        }
                    }
                }
            }
            
            setSuspiciousActivities(detectedActivities.sort((a, b) => b.similarity - a.similarity));

        } catch (error) {
            console.error("Error running cheating detection:", error);
            toast({
                variant: 'destructive',
                title: "Detection Failed",
                description: "Could not fetch and compare submissions.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6" />
                <CardTitle>Cheating Detection</CardTitle>
            </div>
            <Button onClick={runDetection} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Running...' : 'Run Detection'}
            </Button>
        </div>
        <CardDescription>Potentially suspicious submissions based on AI-powered code similarity analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challenge</TableHead>
                <TableHead>Users Involved</TableHead>
                <TableHead>Similarity</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                       <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                       <p>Analyzing submissions...</p>
                    </TableCell>
                </TableRow>
              ) : suspiciousActivities.length > 0 ? (
                suspiciousActivities.map((activity, index) => (
                    <TableRow key={index}>
                    <TableCell className="font-medium">{activity.challenge}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                        {activity.users.map(user => <Badge key={user.id} variant="secondary">{user.name}</Badge>)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={getSimilarityColor(activity.similarity)}>
                        {activity.similarity}%
                        </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedActivity(activity)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        No suspicious activities detected.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => !isOpen && setSelectedActivity(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Review Suspicious Activity</DialogTitle>
                <DialogDescription>
                    Challenge: {selectedActivity?.challenge} | Similarity: <span className={getSimilarityColor(selectedActivity?.similarity || 0)}>{selectedActivity?.similarity}%</span>
                </DialogDescription>
            </DialogHeader>
            
            {selectedActivity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                    {Object.entries(selectedActivity.code).map(([user, code]) => (
                        <div key={user} className="flex flex-col">
                            <h3 className="font-semibold mb-2 text-center">{user}'s Submission</h3>
                            <div className="relative flex-1 rounded-md border">
                                <CodeEditor 
                                    value={code} 
                                    onChange={() => {}} 
                                    language={selectedActivity.language}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <DialogClose asChild>
                <Button variant="outline" className="mt-4" onClick={() => setSelectedActivity(null)}>
                    Close
                </Button>
             </DialogClose>
        </DialogContent>
    </Dialog>
    </>
  );
}
