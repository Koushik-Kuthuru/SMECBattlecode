
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Gift, Info, Star, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { format } from 'date-fns';

export default function ContestDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [contest, setContest] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchContest = async () => {
            setIsLoading(true);
            const contestDocRef = doc(db, 'events', id);
            const contestSnap = await getDoc(contestDocRef);
            if (contestSnap.exists()) {
                setContest({ id: contestSnap.id, ...contestSnap.data() } as Event);
            } else {
                console.log("No such contest!");
            }
            setIsLoading(false);
        };
        fetchContest();
    }, [id]);

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp) return 'Date not set';
        return format(timestamp.toDate(), "EEE, MMM d, HH:mm zzz");
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
        );
    }
    
    if (!contest) {
        return (
            <div className="container mx-auto max-w-4xl py-8">
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
    <div className="container mx-auto max-w-4xl py-8">
       <Link href="/arena" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
           <ArrowLeft className="h-4 w-4"/>
           Back to Arena
       </Link>

        <div className="space-y-8">
            <div>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">{contest.title}</h1>
                 <div className="flex items-center gap-4 text-muted-foreground mt-2">
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

            <div className="flex items-center gap-2">
                <Button>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Register
                </Button>
                <Button variant="outline" size="icon">
                    <Calendar className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" asChild>
                    <a href={contest.registrationLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
            </div>

            <Separator />

            <div className="prose max-w-none text-base">
                <p>{contest.description}</p>

                {contest.prizes && contest.prizes.length > 0 && (
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Bonus Prizes
                        </h2>
                        <ul className="space-y-2 list-disc list-inside">
                           {contest.prizes.map((prize: string, index: number) => (
                                <li key={index}>{prize}</li>
                           ))}
                        </ul>

                        {contest.prizeImages && contest.prizeImages.length > 0 && (
                            <div className="flex items-center justify-center gap-8 mt-6">
                                {contest.prizeImages.map((img: any, index: number) => (
                                    <div key={index} className="flex flex-col items-center gap-2">
                                        <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center p-2 border shadow-sm">
                                            <Image src={img.src} alt={img.alt} width={100} height={100} data-ai-hint={img.hint} className="object-contain" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{img.alt}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-6">
                             Only SMEC accounts are eligible for the bonus rewards. After the ranking is finalized, a faculty member will reach out to you through email regarding the gift!
                        </p>
                    </div>
                )}
                

                <div className="mt-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                        <Info className="h-5 w-5 text-blue-500"/>
                        Important Notes
                    </h2>
                    <ol className="space-y-2 list-decimal list-inside">
                        <li>To provide a better contest and ensure fairness, we listened to our students' feedback and put in lots of thoughts behind the updated contest rule.</li>
                        <li>All submissions will be checked for plagiarism. Any violation will result in disqualification from the contest.</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
  );
}
