
'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trophy, Heart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';


type Contest = {
  title: string;
  date: string;
  imageUrl: string;
  aiHint: string;
  startsIn: string;
  isFeatured?: boolean;
};

const contests: Contest[] = [
  {
    title: 'Weekly Contest #12',
    date: 'Sunday 8:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'abstract geometric',
    startsIn: '4d 23h 19m 14s',
    isFeatured: false,
  },
  {
    title: 'Biweekly Contest #8',
    date: 'Saturday 8:00 PM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'digital cube',
    startsIn: '11d 11h 19m 14s',
    isFeatured: false,
  },
   {
    title: 'SMEC Foundation Day Special',
    date: 'October 14th, 9:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'university celebration',
    startsIn: '25d 10h 05m 01s',
    isFeatured: true,
  },
    {
    title: 'Diwali Code Fest',
    date: 'November 1st, 10:00 AM',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'festival lights',
    startsIn: '42d 12h 15m 31s',
    isFeatured: true,
  },
];

const ContestCard = ({ contest, large = false }: { contest: Contest, large?: boolean }) => (
    <div className="group relative rounded-lg overflow-hidden cursor-pointer shadow-lg transition-transform duration-300 hover:-translate-y-1">
        <Image
            src={contest.imageUrl}
            alt={contest.title}
            width={600}
            height={400}
            className={cn("w-full object-cover transition-transform duration-300 group-hover:scale-105", large ? 'h-56' : 'h-48')}
            data-ai-hint={contest.aiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute top-3 right-3 bg-black/30 p-2 rounded-md backdrop-blur-sm">
            <Calendar className="h-5 w-5 text-white/80" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
                <Clock className="h-4 w-4" />
                <span>Starts in {contest.startsIn}</span>
            </div>
            <h3 className={cn("font-bold", large ? "text-xl" : "text-lg")}>{contest.title}</h3>
            <p className="text-sm text-white/80">{contest.date}</p>
        </div>
    </div>
);

export default function ArenaPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-4 md:px-6 py-12">
        
        {/* Hero Section */}
        <section className="text-center py-16 animate-fade-in-up">
            <Trophy className="h-24 w-24 mx-auto text-yellow-400 mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                SMEC Battle Code <span className="font-light">Contest</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
                Contest every week. Compete and see your ranking!
            </p>
        </section>

        {/* Upcoming Contests */}
        <section className="mb-16">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contests.filter(c => !c.isFeatured).map(contest => (
                    <ContestCard key={contest.title} contest={contest} large />
                ))}
             </div>
        </section>
        
        {/* Featured Contests */}
        <section>
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Featured Contests</h2>
                 <Button variant="link" className="text-sky-400 hover:text-sky-300">
                    <Heart className="mr-2 h-4 w-4" />
                    Sponsor a Contest
                 </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {contests.filter(c => c.isFeatured).map(contest => (
                     <ContestCard key={contest.title} contest={contest} />
                ))}
            </div>
        </section>

      </div>
    </div>
  );
}
