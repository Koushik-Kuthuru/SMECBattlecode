

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
import { formatDistanceToNow, differenceInSeconds, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
    
    return <span>{`${prefix} ${days}d ${hours}h ${minutes}m ${secs}s`}</span>;
};

const ContestCard = ({ id, title, time, schedule, imageUrl, aiHint, status, enrolled }: { id: string; title: string; time: string | JSX.Element; schedule: string; imageUrl: string; aiHint?: string; status: 'live' | 'upcoming' | 'past'; enrolled: number; }) => (
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
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-sm text-white font-medium">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
            </div>
             {status === 'live' && <Badge className="absolute top-3 left-3 bg-red-600 text-white animate-pulse">Live Now</Badge>}
        </div>
        <div className="p-4 bg-card">
          <h3 className="text-lg font-bold text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{schedule}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Users className="h-4 w-4" />
            <span>{enrolled} users registered</span>
          </div>
        </div>
    </Card>
  </Link>
);

const PastContestItem = ({ id, title, date, imageUrl, aiHint }: { id: string; title: string; date: string; imageUrl: string; aiHint?: string }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between p-4 transition-colors hover:bg-muted/50 gap-4">
    <div className="flex items-center gap-4 w-full">
      <Image
        src={imageUrl || 'https://placehold.co/128x72.png'}
        alt={title}
        width={128}
        height={72}
        className="h-12 w-20 rounded-md object-cover"
        data-ai-hint={aiHint}
      />
      <div className="flex-1">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto flex-shrink-0">
      <Link href={`/arena/${id}`}>View</Link>
    </Button>
  </div>
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
    const upcomingContests = contests.filter(c => c.startDate.toDate() > now).sort((a, b) => a.startDate.toDate().getTime() - b.startDate.toDate().getTime());
    const liveContests = contests.filter(c => c.startDate.toDate() <= now && c.endDate.toDate() >= now);
    const pastContests = contests.filter(c => c.endDate.toDate() < now);

    const getTimeDisplay = (contest: Event) => {
        const startDate = contest.startDate.toDate();
        const endDate = contest.endDate.toDate();
        const now = new Date();

        if (now > endDate) return 'Contest Ended';
        if (now >= startDate && now <= endDate) return <Countdown to={endDate} prefix="Ends in" />;
        return <Countdown to={startDate} prefix="Starts in" />;
    };
    
    const getScheduleDisplay = (contest: Event) => {
        const date = contest.startDate.toDate();
        const offset = -date.getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
        const sign = offset >= 0 ? '+' : '-';
        return `${format(date, "EEE, MMM d, HH:mm")} GMT${sign}${offsetHours}:${offsetMinutes}`;
    };

  return (
    <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
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
                            <Carousel opts={{ align: "start" }} className="w-full">
                                <CarouselContent>
                                    {liveContests.map(contest => (
                                        <CarouselItem key={contest.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                                            <div className="p-1">
                                                <ContestCard
                                                    id={contest.id}
                                                    title={contest.title}
                                                    time={getTimeDisplay(contest)}
                                                    schedule={getScheduleDisplay(contest)}
                                                    imageUrl={contest.imageUrl}
                                                    aiHint={contest.aiHint}
                                                    status="live"
                                                    enrolled={contest.enrolled || 0}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        </div>
                    )}
                    
                    {upcomingContests.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Battles</h2>
                           <Carousel opts={{ align: "start" }} className="w-full">
                                <CarouselContent>
                                    {upcomingContests.map(contest => (
                                         <CarouselItem key={contest.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                                            <div className="p-1">
                                                <ContestCard
                                                    id={contest.id}
                                                    title={contest.title}
                                                    time={getTimeDisplay(contest)}
                                                    schedule={getScheduleDisplay(contest)}
                                                    imageUrl={contest.imageUrl}
                                                    aiHint={contest.aiHint}
                                                    status="upcoming"
                                                    enrolled={contest.enrolled || 0}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        </div>
                    )}

                    {pastContests.length > 0 && (
                        <div className="mt-20">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Past Battles</h2>
                             <Card>
                                <CardContent className="p-0">
                                  <div className="divide-y">
                                    {pastContests.slice(0, 5).map(contest => (
                                        <PastContestItem
                                            key={contest.id}
                                            id={contest.id}
                                            title={contest.title}
                                            date={format(contest.startDate.toDate(), "MMM d, yyyy, h:mm a")}
                                            imageUrl={contest.imageUrl}
                                            aiHint={contest.aiHint}
                                        />
                                    ))}
                                  </div>
                                </CardContent>
                                {pastContests.length > 5 && (
                                    <CardFooter className="justify-center p-4">
                                        <Button variant="ghost">View More</Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
}
