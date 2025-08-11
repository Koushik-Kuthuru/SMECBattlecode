
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Info, ShieldCheck, ThumbsUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BulletCoin } from '@/components/icons';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 md:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
            <Info className="h-8 w-8 text-primary" />
            About SMEC Battle Code
          </CardTitle>
          <CardDescription className="text-md md:text-lg">
            Your arena for mastering code, competing with peers, and achieving excellence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-base text-muted-foreground">
          
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2 text-card-foreground">
              <ThumbsUp className="h-6 w-6 text-blue-500" />
              Our Mission
            </h2>
            <p>
              Welcome to SMEC Battle Code, the official competitive programming platform of <strong>St. Martin's Engineering College (SMEC)</strong>. Our mission is to provide an exclusive, dynamic, and supportive environment for SMEC students to hone their problem-solving skills, prepare for technical interviews at top-tier companies, and foster a vibrant culture of coding excellence within our college community.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2 text-card-foreground">
              <BulletCoin className="h-6 w-6 text-yellow-500" />
              How It Works: Challenges & Scoring
            </h2>
            <p>
              The platform is built around a series of coding challenges designed to test your understanding of various computer science concepts. Here’s how you can participate and climb the ranks:
            </p>
            <ul className="space-y-3 list-disc list-inside pl-4">
                <li>
                  <strong className="text-green-500">Easy Challenges:</strong> Indicated by a <span className="font-bold">green</span> marker. These are designed to get you started, covering fundamental programming concepts and simple algorithms, and are worth <strong className="inline-flex items-center gap-1"><BulletCoin className="h-4 w-4" />10 Points</strong>. Perfect for warming up!
                </li>
                <li>
                  <strong className="text-yellow-500">Medium Challenges:</strong> Indicated by a <span className="font-bold">yellow</span> marker. These problems require a more solid grasp of data structures and common algorithms and are worth <strong className="inline-flex items-center gap-1"><BulletCoin className="h-4 w-4" />25 Points</strong>. They often mirror questions asked in the initial rounds of technical interviews.
                </li>
                 <li>
                  <strong className="text-red-500">Hard Challenges:</strong> Indicated by a <span className="font-bold">red</span> marker. These are complex problems that demand advanced algorithmic knowledge, efficiency, and creative problem-solving skills, and are worth <strong className="inline-flex items-center gap-1"><BulletCoin className="h-4 w-4" />50 Points</strong>, similar to what you might encounter in final interview rounds.
                </li>
            </ul>
             <p>
                To solve a challenge, your code must pass all test cases, including several hidden ones. Your total score is the sum of the points from all the challenges you have successfully solved, which is then reflected on the global leaderboard.
            </p>
          </div>
          
          <Separator />

          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2 text-card-foreground">
                <ShieldCheck className="h-6 w-6 text-red-600" />
                Academic Integrity & Rules
            </h2>
            <p>
                To ensure a fair and competitive environment for all students, we have a strict academic integrity policy. The platform is designed to help you learn and grow, not to find shortcuts. Please adhere to the following rules:
            </p>
            <ul className="space-y-3 list-disc list-inside pl-4">
                <li>
                    <strong>No Plagiarism:</strong> All submitted code must be your own original work. Copying solutions from the internet or other students is strictly prohibited and will result in disqualification.
                </li>
                <li>
                    <strong>Focus on the Editor:</strong> The code editor is designed to be your primary workspace. To maintain a fair testing environment, we discourage navigating away from the challenge page while you are solving a problem.
                </li>
                 <li>
                    <strong>Code Integrity:</strong> The editor disables actions like copy, paste, and right-clicking to encourage you to write and debug your code from scratch, which is crucial for building deep understanding.
                </li>
            </ul>
             <p>
                Upholding these standards ensures that your position on the leaderboard is a true reflection of your skill and hard work. Let's build a community of integrity and excellence together!
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
