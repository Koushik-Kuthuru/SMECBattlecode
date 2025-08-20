
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trophy, Users, CheckCircle, CalendarDays, Heart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';


const ContestCard = ({ title, time, schedule, imageUrl, aiHint }: { title: string, time: string, schedule: string, imageUrl: string, aiHint: string }) => (
  <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
      <Image
        src={imageUrl}
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
);

const FeaturedContestCard = ({ title, description, imageUrl, aiHint }: { title: string, description: string, imageUrl: string, aiHint: string }) => (
    <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
         <Image
            src={imageUrl}
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
);


export default function ArenaPage() {
  return (
    <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl py-12">
            <div className="text-center">
                <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
                <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    Contest Arena
                </h1>
                <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
                    Contest every week. Compete and see your ranking!
                </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
                <ContestCard 
                    title="Weekly Contest 464" 
                    time="Starts in 3d 11h 18m" 
                    schedule="Sunday 8:00 AM GMT+5:30"
                    imageUrl="https://placehold.co/600x400.png"
                    aiHint="abstract geometric"
                />
                <ContestCard 
                    title="Biweekly Contest 164" 
                    time="Starts in 9d 23h 18m" 
                    schedule="Saturday 8:00 PM GMT+5:30"
                    imageUrl="https://placehold.co/600x400.png"
                    aiHint="digital cube"
                />
            </div>

            <div className="mt-20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Featured Contests</h2>
                    <Button variant="link" className="text-primary hover:text-primary/80">
                        <Heart className="mr-2 h-4 w-4" />
                        Sponsor a Contest
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                     <FeaturedContestCard 
                        title="SMEC BATTLECODE '24"
                        description="The flagship annual coding competition of SMEC."
                        imageUrl="https://placehold.co/800x450.png"
                        aiHint="futuristic technology"
                    />
                     <FeaturedContestCard 
                        title="Logic Legion Finals"
                        description="The ultimate test for logical thinkers and problem solvers."
                        imageUrl="https://placehold.co/800x450.png"
                        aiHint="cyberpunk city"
                    />
                </div>
            </div>
        </div>
    </div>
  );
}
