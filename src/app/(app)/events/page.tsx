
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Loader2, Podcast, Users, Video } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';

const EventIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Podcast':
            return <Podcast className="h-4 w-4" />;
        case 'Challenge':
            return <Video className="h-4 w-4" />;
        case 'Workshop':
            return <Users className="h-4 w-4" />;
        default:
            return <Calendar className="h-4 w-4" />;
    }
}

function EventCard({ event }: { event: Event }) {
  const formatDate = (timestamp: Timestamp) => timestamp.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <Card className="flex flex-col overflow-hidden transition-transform hover:scale-105">
      <CardHeader className="p-0">
        <Image
          src={event.imageUrl || 'https://placehold.co/600x400.png'}
          alt={event.title}
          width={600}
          height={400}
          className="w-full h-48 object-cover"
          data-ai-hint={event.aiHint}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <EventIcon type={event.type} />
            <span>{event.type}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(event.startDate)}</span>
        </div>
        <h3 className="text-lg font-semibold line-clamp-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{event.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center bg-muted/50">
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{event.enrolled} Enrolled</span>
        </div>
        <Button asChild size="sm" disabled={!event.registrationLink}>
            <Link href={event.registrationLink || '#'} target="_blank" rel="noopener noreferrer">
                Register
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('All');

  useEffect(() => {
    const eventsCollectionRef = collection(db, 'events');
    const q = query(eventsCollectionRef, orderBy('startDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const eventsList = snapshot.docs
        .map(doc => {
            const data = doc.data() as Omit<Event, 'id' | 'status'>;
            let status: Event['status'] = 'upcoming';
            if (data.startDate.toDate() <= now && data.endDate.toDate() >= now) {
            status = 'live';
            } else if (data.endDate.toDate() < now) {
            status = 'past';
            }
            return { id: doc.id, ...data, status } as Event;
        })
        .filter(event => event.isEnabled && event.type !== 'Challenge'); // Filter on the client-side

      setEvents(eventsList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'live');
  const pastEvents = events.filter(e => e.status === 'past');

  const filterEvents = (eventList: Event[]) => {
    if (eventTypeFilter === 'All') return eventList;
    return eventList.filter(e => e.type === eventTypeFilter);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Discover workshops, challenges, and live sessions.</p>
        </div>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Podcast">Podcast</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="upcoming">Upcoming & Live</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterEvents(upcomingEvents).map(event => <EventCard key={event.id} event={event} />)}
              </div>
              {filterEvents(upcomingEvents).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">No upcoming events match your filter.</div>
              )}
            </TabsContent>
            <TabsContent value="past" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterEvents(pastEvents).map(event => <EventCard key={event.id} event={event} />)}
              </div>
              {filterEvents(pastEvents).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">No past events match your filter.</div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
