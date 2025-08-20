
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trophy, Users, CheckCircle, CalendarDays, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const Countdown = ({ to, onEnd }: { to: Date, onEnd: () => void }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
            if (differenceInSeconds(to, new Date()) <= 0) {
                onEnd();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [to, onEnd]);

    const seconds = differenceInSeconds(to, now);
    if (seconds <= 0) return <span>Event is live!</span>;

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600*24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return <span>{`${days}d ${hours}h ${minutes}m ${secs}s`}</span>;
};

const ContestCard = ({ id, title, time, schedule, imageUrl, aiHint, status }: { id: string; title: string; time: string | JSX.Element; schedule: string; imageUrl: string; aiHint?: string; status: 'live' | 'upcoming' | 'past' }) => (
  <Link href={`/arena/${id}`} className="block group">
    <Card className="overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:transform group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-primary/20">
        <div className="relative h-56">
            <Image
              src={imageUrl || 'https://placehold.co/600x400.png'}
              alt={title}
              width={600}
              height={400}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={aiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            <div className="absolute top-3 right-3 rounded-lg bg-black/30 p-2 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-sm text-white font-medium">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
            </div>
             {status === 'live' && <Badge className="absolute top-3 left-3 bg-red-600 text-white animate-pulse">Live Now</Badge>}
        </div>
        <div className="p-4 bg-card">
          <h3 className="text-lg font-bold text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{schedule}</p>
        </div>
    </Card>
  </Link>
);

const FeaturedContestCard = ({ id, title, description, imageUrl, aiHint }: { id: string; title: string; description: string; imageUrl: string; aiHint?: string }) => (
    <Link href={`/arena/${id}`} className="block">
        <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
             <Image
                src={imageUrl || 'https://placehold.co/800x450.png'}
                alt={title}
                width={800}
                height={450}
                className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-300 group-hover:opacity-40"
                data-ai-hint={aiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            <div className="relative flex h-48 flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-card-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </Card>
    </Link>
);


export default function ArenaPage() {
    const [contests, setContests] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [_, setTick] = useState(0); // Forcing re-render for countdowns

    useEffect(() => {
        const eventsCollectionRef = collection(db, 'events');
        const q = query(eventsCollectionRef, 
            orderBy('startDate', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const contestList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Event))
                .filter(event => event.type === 'Challenge' && event.isEnabled);
            setContests(contestList);
            setIsLoading(false);
        });
        
        const interval = setInterval(() => setTick(t => t + 1), 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const now = new Date();
    const upcomingContests = contests.filter(c => c.startDate.toDate() > now);
    const liveContests = contests.filter(c => c.startDate.toDate() <= now && c.endDate.toDate() >= now);
    const pastContests = contests.filter(c => c.endDate.toDate() < now);

    const getTimeDisplay = (contest: Event) => {
        const now = new Date();
        if (contest.endDate.toDate() < now) return 'Contest Ended';
        if (contest.startDate.toDate() <= now) return `Ends ${formatDistanceToNow(contest.endDate.toDate(), { addSuffix: true })}`;
        return <Countdown to={contest.startDate.toDate()} onEnd={() => setTick(t => t + 1)} />;
    };

  return (
    <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl py-12 px-4 md:px-6">
            <div className="text-center">
                <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
                <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    BATTLE ARENA
                </h1>
                <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
                    Battle every 2 to 3 weeks, complete and see your ranking
                </p>
            </div>
             {isLoading ? (
                 <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                 </div>
            ) : (
                <>
                    {liveContests.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Live Now</h2>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {liveContests.map(contest => (
                                    <ContestCard
                                        key={contest.id}
                                        id={contest.id}
                                        title={contest.title}
                                        time={getTimeDisplay(contest)}
                                        schedule={contest.startDate.toDate().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                        imageUrl={contest.imageUrl}
                                        aiHint={contest.aiHint}
                                        status="live"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {upcomingContests.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Contests</h2>
                           <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {upcomingContests.map(contest => (
                                    <ContestCard
                                        key={contest.id}
                                        id={contest.id}
                                        title={contest.title}
                                        time={getTimeDisplay(contest)}
                                        schedule={contest.startDate.toDate().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                        imageUrl={contest.imageUrl}
                                        aiHint={contest.aiHint}
                                        status="upcoming"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {pastContests.length > 0 && (
                        <div className="mt-20">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                <h2 className="text-2xl font-bold text-foreground">Featured Past Contests</h2>
                                <Button variant="link" className="text-primary hover:text-primary/80">
                                    <Heart className="mr-2 h-4 w-4" />
                                    Sponsor a Contest
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {pastContests.slice(0, 2).map(contest => (
                                    <FeaturedContestCard
                                        key={contest.id}
                                        id={contest.id}
                                        title={contest.title}
                                        description={contest.description}
                                        imageUrl={contest.imageUrl}
                                        aiHint={contest.aiHint}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
}
