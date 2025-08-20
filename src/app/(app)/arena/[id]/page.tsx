
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Gift, Info, Star, ExternalLink, RefreshCw, Loader2, Megaphone, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp, onSnapshot, runTransaction, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';

export default function ContestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const [contest, setContest] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!id) return;

        const contestDocRef = doc(db, 'events', id);
        const unsubscribe = onSnapshot(contestDocRef, (docSnap) => {
            setIsLoading(true);
            if (docSnap.exists()) {
                setContest({ id: docSnap.id, ...docSnap.data() } as Event);
            } else {
                console.log("No such contest!");
                setContest(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    const handleRegister = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to register for contests.' });
            router.push('/login');
            return;
        }
        if (!id) return;
        setIsRegistering(true);

        const contestDocRef = doc(db, 'events', id);
        try {
            await runTransaction(db, async (transaction) => {
                const contestDoc = await transaction.get(contestDocRef);
                if (!contestDoc.exists()) {
                    throw new Error("Contest does not exist!");
                }
                transaction.update(contestDocRef, { enrolled: increment(1) });
            });
            toast({ title: "Registration Successful!", description: "You've been enrolled in the contest." });
        } catch (error) {
            console.error("Error registering for contest:", error);
            toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not register for the contest. Please try again.' });
        } finally {
            setIsRegistering(false);
        }
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return 'Date not set';
        return format(timestamp.toDate(), "EEE, MMM d, HH:mm zzz");
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
        );
    }
    
    if (!contest) {
        return (
            <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
                <Link href="/arena" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4"/>
                    Back to Arena
                </Link>
                <h1 className="text-3xl font-bold">Contest Not Found</h1>
                <p className="text-muted-foreground">The contest you are looking for does not exist or may have been removed.</p>
            </div>
        );
    }


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
       <Link href="/arena" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
           <ArrowLeft className="h-4 w-4"/>
           Back to Arena
       </Link>

        <div className="space-y-8">
            <div>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">{contest.title}</h1>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-muted-foreground mt-2">
                     <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(contest.startDate)}</span>
                     </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>Ends {formatDate(contest.endDate)}</span>
                     </div>
                 </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button onClick={handleRegister} disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Register
                </Button>
                {contest.registrationLink && (
                    <Button variant="outline" asChild>
                        <a href={contest.registrationLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Official Registration
                        </a>
                    </Button>
                )}
            </div>

            <Separator />

            <div className="prose max-w-none text-base">
                <p>{contest.description}</p>

                {contest.announcements && contest.announcements.length > 0 && (
                     <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-blue-800">
                            <Megaphone className="h-5 w-5" />
                            Announcements
                        </h2>
                        <ul className="space-y-2 list-disc list-inside">
                           {contest.announcements.map((announcement: string, index: number) => (
                                <li key={index}>{announcement}</li>
                           ))}
                        </ul>
                    </div>
                )}
                
                {contest.importantNotes && contest.importantNotes.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Info className="h-5 w-5 text-blue-500"/>
                            Important Notes
                        </h2>
                        <ul className="space-y-2 list-disc list-inside">
                           {contest.importantNotes.map((note: string, index: number) => (
                                <li key={index}>{note}</li>
                           ))}
                        </ul>
                    </div>
                )}

                 {contest.prizes && contest.prizes.length > 0 && (
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-amber-800">
                            <Star className="h-5 w-5" />
                            Prizes
                        </h2>
                        <div className="space-y-3">
                           {contest.prizes.map((prize, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-baseline">
                                    <span className="font-bold w-full sm:w-24 shrink-0">{prize.rank}:</span>
                                    <span>{prize.details}</span>
                                </div>
                           ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-6">
                             Only SMEC accounts are eligible for rewards. After the ranking is finalized, a faculty member will reach out to you through email regarding the gift!
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
