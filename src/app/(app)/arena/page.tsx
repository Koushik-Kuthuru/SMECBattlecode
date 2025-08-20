
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trophy, Users, CheckCircle } from 'lucide-react';

const ContestCard = ({ title, description, participants, time, isLive, isCompleted }: { title: string, description: string, participants: string, time: string, isLive?: boolean, isCompleted?: boolean }) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      {isLive && <div className="text-red-500 font-bold mb-2 flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div> LIVE</div>}
      {isCompleted && <div className="text-green-500 font-bold mb-2 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> COMPLETED</div>}
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center text-sm text-muted-foreground gap-4">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{participants}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{time}</span>
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full" variant={isLive ? 'default' : 'secondary'} disabled={isCompleted}>
        {isLive ? 'Join Now' : isCompleted ? 'View Results' : 'View Contest'}
      </Button>
    </CardFooter>
  </Card>
);

export default function ArenaPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-4">
          <span className="font-mono text-primary">Battle</span>
          <Trophy className="h-10 w-10 text-amber-400" />
          <span className="font-mono">Arena</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Test your skills in our official programming contests.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl">SMEC BATTLECODE'24</CardTitle>
              <CardDescription className="text-primary-foreground/80">The flagship annual coding competition.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Prepare for the ultimate test of coding prowess. Solve challenging problems, compete against the best, and claim victory.</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="bg-white/90 text-black hover:bg-white">Learn More</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-1 flex justify-center">
            <div className="p-8 bg-card rounded-full border-8 border-amber-300 shadow-2xl">
                <Trophy className="h-32 w-32 text-amber-500" />
            </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming & Live Contests</h2>
        <div className="grid md:grid-cols-3 gap-6">
            <ContestCard isLive title="Live Now: Algo Sprint" description="A fast-paced algorithmic challenge." participants="250+" time="60 Mins" />
            <ContestCard title="Weekly Rumble #12" description="A quick 90-minute contest with 3 problems." participants="150+" time="90 Mins" />
            <ContestCard title="Data Structures Showdown" description="Test your knowledge of advanced data structures." participants="80+" time="3 Hours" />
        </div>
      </div>

       <div>
        <h2 className="text-2xl font-bold mb-4">Completed Contests</h2>
        <div className="grid md:grid-cols-3 gap-6">
            <ContestCard isCompleted title="Python Code-Off" description="Python-exclusive problems for all skill levels." participants="120+" time="2 Hours" />
            <ContestCard isCompleted title="Logic Legion" description="Put your logical thinking to the test." participants="200+" time="2.5 Hours" />
            <ContestCard isCompleted title="Beginner's Bash" description="A friendly contest for newcomers." participants="95+" time="90 Mins" />
        </div>
      </div>
    </div>
  );
}
