
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
import { formatDistanceToNow } from 'date-fns';

const ContestCard = ({ id, title, time, schedule, imageUrl, aiHint }: { id: string; title: string; time: string; schedule: string; imageUrl: string; aiHint?: string }) => (
  <Link href={`/arena/${id}`} className="block">
    <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
        <Image
          src={imageUrl || 'https://placehold.co/600x400.png'}
          alt={title}
          width={600}
          height={400}
          className="absolute inset-0 h-full w-full object-cover opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          data-ai-hint={aiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent"></div>
        
        <div className="relative flex h-full flex-col p-6">
          <div className="flex justify-end">
              <div className="rounded-lg bg-black/5 p-2">
                  <CalendarDays className="h-5 w-5 text-card-foreground" />
              </div>
          </div>
          <div className="flex-grow pt-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{time}</span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{schedule}</p>
          </div>
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

        return () => unsubscribe();
    }, []);

    const now = new Date();
    const upcomingContests = contests.filter(c => c.startDate.toDate() > now);
    const liveContests = contests.filter(c => c.startDate.toDate() <= now && c.endDate.toDate() >= now);
    const pastContests = contests.filter(c => c.endDate.toDate() < now);

    const getTimeDifference = (date: Timestamp) => {
        return formatDistanceToNow(date.toDate(), { addSuffix: true });
    };

  return (
    <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl py-12">
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
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {liveContests.map(contest => (
                                    <ContestCard
                                        key={contest.id}
                                        id={contest.id}
                                        title={contest.title}
                                        time={`Ends ${getTimeDifference(contest.endDate)}`}
                                        schedule={contest.startDate.toDate().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                        imageUrl={contest.imageUrl}
                                        aiHint={contest.aiHint}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {upcomingContests.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Contests</h2>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {upcomingContests.map(contest => (
                                    <ContestCard
                                        key={contest.id}
                                        id={contest.id}
                                        title={contest.title}
                                        time={`Starts ${getTimeDifference(contest.startDate)}`}
                                        schedule={contest.startDate.toDate().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                        imageUrl={contest.imageUrl}
                                        aiHint={contest.aiHint}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {pastContests.length > 0 && (
                        <div className="mt-20">
                            <div className="flex justify-between items-center mb-6">
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
