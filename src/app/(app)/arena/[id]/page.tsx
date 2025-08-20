
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, Gift, Info, Star, ExternalLink, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';


// Mock data - replace with real data fetching
const contestData: { [key: string]: any } = {
    'weekly-contest-464': {
        title: 'Weekly Contest 464',
        date: 'Sun, Aug 24, 08:00 GMT+05:30',
        countdown: 'Starts in 3d 10:42:17',
        welcomeMessage: 'Welcome to the 464th SMEC Weekly Contest. This contest is sponsored by SMEC.',
        prizes: [
            'Contestants ranked 1st - 3rd will win a SMEC Backpack',
            'Contestants ranked 4th - 10th will win a SMEC Water Bottle',
            'Contestants ranked 63rd, 463rd, and 1024th will win a SMEC Big O Notebook'
        ],
        prizeImages: [
            { src: 'https://placehold.co/100x100.png', alt: 'Backpack', hint: 'tech backpack' },
            { src: 'https://placehold.co/100x100.png', alt: 'Water Bottle', hint: 'water bottle' },
            { src: 'https://placehold.co/100x100.png', alt: 'Notebook', hint: 'notebook' },
        ],
        notes: [
            'To provide a better contest and ensure fairness, we listened to our students\' feedback and put in lots of thoughts behind the updated contest rule.',
            'All submissions will be checked for plagiarism. Any violation will result in disqualification from the contest.'
        ]
    },
    'biweekly-contest-164': {
        title: 'Biweekly Contest 164',
        date: 'Sat, Sep 6, 20:00 GMT+05:30',
        countdown: 'Starts in 9d 23h 18m',
        welcomeMessage: 'Welcome to the 164th SMEC Biweekly Contest.',
        prizes: [
            'Top 5 participants will receive a certificate of excellence.',
            'Top scorer will get a special mention on the college website.'
        ],
        prizeImages: [],
        notes: [
            'This is a biweekly event to help you practice regularly.',
            'Focus on clean, efficient code.'
        ]
    },
    'smec-battlecode-24': {
        title: "SMEC BATTLECODE '24",
        date: 'Mon, Oct 20, 10:00 GMT+05:30',
        countdown: 'Starts in 2 months',
        welcomeMessage: 'Welcome to the flagship annual coding competition of St. Martin\'s Engineering College!',
        prizes: [
            'Winner gets the BATTLECODE Trophy and a cash prize.',
            'Top 10 finishers get exclusive SMEC merchandise.'
        ],
        prizeImages: [
            { src: 'https://placehold.co/100x100.png', alt: 'Trophy', hint: 'gold trophy' }
        ],
        notes: [
            'This is the most prestigious coding event of the year.',
            'Prepare well and good luck!'
        ]
    },
     'logic-legion-finals': {
        title: 'Logic Legion Finals',
        date: 'Fri, Nov 1, 14:00 GMT+05:30',
        countdown: 'Starts in 2 months 10 days',
        welcomeMessage: 'The ultimate test for logical thinkers and problem solvers.',
        prizes: [
            'The winner will be crowned the "Logic King/Queen".',
            'All finalists will receive internship interview opportunities.'
        ],
        prizeImages: [],
        notes: [
            'Only the top 50 participants from the qualifiers are eligible.'
        ]
    }
};

export default function ContestDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const contest = contestData[id] || contestData['weekly-contest-464']; // Fallback to a default

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
                        <span>{contest.date}</span>
                     </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{contest.countdown}</span>
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
                 <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            <div className="prose max-w-none text-base">
                <p>{contest.welcomeMessage}</p>

                {contest.prizes.length > 0 && (
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

                        {contest.prizeImages.length > 0 && (
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
                

                {contest.notes.length > 0 && (
                     <div className="mt-8">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                           <Info className="h-5 w-5 text-blue-500"/>
                           Important Notes
                        </h2>
                        <ol className="space-y-2 list-decimal list-inside">
                            {contest.notes.map((note: string, index: number) => (
                                 <li key={index}>{note}</li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
