

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Gift, Info, Star, ExternalLink, RefreshCw, Loader2, Megaphone, CheckCircle, Trophy, Swords, Share2, LogOut, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp, onSnapshot, runTransaction, increment, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { BulletCoin } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Countdown = ({ to, prefix }: { to: Date, prefix: string }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            const newNow = new Date();
            setNow(newNow);
            if (differenceInSeconds(to, newNow) <= 0) {
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [to]);

    const seconds = differenceInSeconds(to, now);
    if (seconds <= 0) return null;

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600*24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${prefix} ${days}d ${hours}h ${minutes}m ${secs}s`;
};

export default function ContestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    const [contest, setContest] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!id) return;

        const contestDocRef = doc(db, 'events', id);
        const unsubscribe = onSnapshot(contestDocRef, (docSnap) => {
            setIsLoading(true);
            if (docSnap.exists()) {
                const contestData = { id: docSnap.id, ...docSnap.data() } as Event;
                setContest(contestData);
                // Check if current user is registered
                if (currentUser && contestData.registeredUsers?.includes(currentUser.uid)) {
                    setIsRegistered(true);
                } else {
                    setIsRegistered(false);
                }
            } else {
                console.log("No such contest!");
                setContest(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser]);

    const handleRegisterConfirm = async () => {
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
                 const contestData = contestDoc.data();
                 // Prevent double registration in transaction
                if (contestData.registeredUsers?.includes(currentUser.uid)) {
                    return;
                }
                transaction.update(contestDocRef, { 
                    enrolled: increment(1),
                    registeredUsers: arrayUnion(currentUser.uid)
                });
            });
            setIsRegistered(true);
        } catch (error) {
            console.error("Error registering for contest:", error);
            toast({ variant: 'destructive', title: 'Registration Failed', description: 'Could not register for the contest. Please try again.' });
        } finally {
            setIsRegistering(false);
        }
    };
    
    const handleUnregisterConfirm = async () => {
        if (!currentUser || !id) return;
        setIsRegistering(true); // Reuse the same loading state

        const contestDocRef = doc(db, 'events', id);
        try {
            await runTransaction(db, async (transaction) => {
                const contestDoc = await transaction.get(contestDocRef);
                if (!contestDoc.exists()) {
                    throw new Error("Contest does not exist!");
                }
                transaction.update(contestDocRef, {
                    enrolled: increment(-1),
                    registeredUsers: arrayRemove(currentUser.uid)
                });
            });
            setIsRegistered(false);
            toast({ title: 'Unregistered', description: 'You have successfully left the contest.' });
        } catch (error) {
            console.error("Error unregistering from contest:", error);
            toast({ variant: 'destructive', title: 'Unregistration Failed', description: 'Could not leave the contest. Please try again.' });
        } finally {
            setIsRegistering(false);
        }
    };

    const handleShare = async () => {
        if (!contest) return;
        setIsSharing(true);
        const shareData = {
            title: contest.title,
            text: `Check out the "${contest.title}" coding contest on SMEC Battle Code!`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast({
                    title: 'Link Copied!',
                    description: 'Contest link copied to clipboard.',
                });
            }
        } catch (error: any) {
            // Fallback for when sharing is denied or fails
            if (error.name === 'NotAllowedError') {
                 await navigator.clipboard.writeText(window.location.href);
                 toast({
                    title: 'Link Copied!',
                    description: 'Sharing was blocked, so we copied the link for you.',
                });
            } else {
                console.error('Error sharing:', error);
                toast({
                    variant: 'destructive',
                    title: 'Sharing Failed',
                    description: 'Could not share the contest link.',
                });
            }
        } finally {
            setIsSharing(false);
        }
    };

    const formatFullDate = (timestamp?: Timestamp) => {
        if (!timestamp) return 'Date not set';
        const date = timestamp.toDate();
        const offset = -date.getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
        const sign = offset >= 0 ? '+' : '-';
        return `${format(date, "EEE, MMM d, HH:mm")} GMT${sign}${offsetHours}:${offsetMinutes}`;
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

  const customColorStyle = contest.color ? { color: contest.color } : {};
  const customBgColorStyle = contest.color ? { backgroundColor: contest.color } : {};
  
  const now = new Date();
  const startDate = contest.startDate.toDate();
  const endDate = contest.endDate.toDate();

  let contestStatus: 'upcoming' | 'live' | 'past' = 'upcoming';
  if (now >= startDate && now <= endDate) {
    contestStatus = 'live';
  } else if (now > endDate) {
    contestStatus = 'past';
  }

  const getStatusDisplay = () => {
    switch (contestStatus) {
        case 'upcoming':
            return <Countdown to={startDate} prefix="Starts in" />;
        case 'live':
            return <Countdown to={endDate} prefix="Ends in" />;
        case 'past':
            return <span>Ended {formatDistanceToNow(endDate, { addSuffix: true })}</span>;
    }
  };


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
       <Link href="/arena" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
           <ArrowLeft className="h-4 w-4"/>
           Back to Arena
       </Link>

        <div className="space-y-8">
            <div>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={customColorStyle}>{contest.title}</h1>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-x-4 gap-y-2 text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatFullDate(contest.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-primary">
                        <Clock className="h-4 w-4" />
                        {getStatusDisplay()}
                    </div>
                 </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-2">
                {contestStatus === 'past' ? (
                     <Button disabled>
                        <Play className="mr-2 h-4 w-4" />
                        Virtual Contest
                    </Button>
                ) : isRegistered ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button className="bg-green-600 hover:bg-red-600 group" disabled={isRegistering}>
                                <span className="group-hover:hidden flex items-center">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Registered
                                </span>
                                <span className="hidden group-hover:flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Leave the Contest?
                                </span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>Leave the Contest?</AlertDialogTitle>
                                <AlertDialogDescription>
                                   Are you sure you want to unregister? You can always join back before the contest starts.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnregisterConfirm} disabled={isRegistering} className="bg-destructive hover:bg-destructive/90">
                                    {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Leave Contest
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={isRegistering || contestStatus === 'past'} className="group transition-transform hover:scale-105" style={customBgColorStyle}>
                                <Swords className="mr-2 h-4 w-4 transition-transform group-hover:rotate-6" />
                                Register
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Register for Contest?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    If you can't participate, you can unregister before the contest begins to keep your rating safe. Are you sure you want to proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRegisterConfirm} disabled={isRegistering}>
                                    {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirm Registration
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                <Button variant="outline" onClick={handleShare} disabled={isSharing}>
                    {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                    Share
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
                    <div className="mt-8">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Trophy className="h-6 w-6 text-amber-500"/>
                            Prizes
                        </h2>
                         <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {contest.prizes.map((prize, index) => (
                                         <div key={index} className="flex justify-between items-center p-4">
                                            <span className="font-semibold">{prize.rank}</span>
                                            <div className="flex items-center gap-2 font-bold text-lg text-primary">
                                                <span>{prize.details}</span>
                                                <BulletCoin className="h-5 w-5" />
                                            </div>
                                         </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
