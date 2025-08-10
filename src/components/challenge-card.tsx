
'use client';

import { type Challenge } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BulletCoin } from './icons';

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted: boolean;
  isInProgress: boolean;
}

export function ChallengeCard({ challenge, isCompleted, isInProgress }: ChallengeCardProps) {
    const difficultyColors = {
        Easy: 'text-green-500 border-green-500/50 bg-green-500/10',
        Medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
        Hard: 'text-red-500 border-red-500/50 bg-red-500/10',
    };

    const getStatusInfo = () => {
        if (isCompleted) {
            return { text: 'Completed', icon: <CheckCircle className="h-4 w-4 text-green-500" />, buttonText: 'View Submission' };
        }
        if (isInProgress) {
            return { text: 'In Progress', icon: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />, buttonText: 'Continue' };
        }
        return { text: 'Not Started', icon: null, buttonText: 'Start Challenge' };
    };

    const { text: statusText, icon: statusIcon, buttonText } = getStatusInfo();


  return (
    <Card className="flex flex-col h-full">
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                <Badge variant="outline" className={cn("text-xs whitespace-nowrap", difficultyColors[challenge.difficulty])}>
                    {challenge.difficulty}
                </Badge>
            </div>
            <CardDescription className="flex items-center gap-4 pt-2">
                 <div className="flex items-center gap-1">
                    <BulletCoin className="h-4 w-4 text-primary" />
                    <span>{challenge.points} Points</span>
                 </div>
                 {statusIcon && (
                    <div className="flex items-center gap-1 font-medium">
                        {statusIcon}
                        <span>{statusText}</span>
                    </div>
                 )}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
                {challenge.description}
            </p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={`/challenge/${challenge.id}`}>
                    {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
  );
}
