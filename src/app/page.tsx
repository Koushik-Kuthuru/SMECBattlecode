
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SmecBattleCodeLogo, BulletCoin } from '@/components/icons';
import { ArrowRight, BrainCircuit, Code, Trophy, Calendar, Target, Users, Gavel, BookCheck, ShieldCheck, Flame, ListChecks, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type LeaderboardUser = {
  name: string;
  points: number;
  imageUrl?: string;
};

export default function LandingPage() {
    const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const q = query(
                    usersCollection, 
                    where('isAdmin', '!=', true),
                    orderBy('points', 'desc'), 
                    limit(3)
                );
                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map(doc => doc.data() as LeaderboardUser);
                setTopUsers(users);
            } catch (error) {
                console.error("Error fetching top users: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopUsers();
    }, []);

    const podiumUsers = [
        topUsers.length > 1 ? topUsers[1] : null, // 2nd
        topUsers.length > 0 ? topUsers[0] : null, // 1st
        topUsers.length > 2 ? topUsers[2] : null, // 3rd
    ];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container z-10 mx-auto flex items-center justify-between h-20 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <SmecBattleCodeLogo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">SMEC Battle Code</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Sign Up <ArrowRight className="ml-2 h-4 w-4 hidden sm:inline" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="parallax-section relative text-center overflow-hidden">
            <div 
              className="parallax-background" 
              style={{ backgroundImage: "url('https://placehold.co/1920x1080.png')" }}
              data-ai-hint="abstract technology"
            ></div>
            <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-0" />
             <div className="relative z-10 text-white container mx-auto flex flex-col items-center justify-center px-4">
                 <div className="animate-fade-in-up">
                    <Badge className="mb-4 bg-white/10 text-white hover:bg-white/20">Exclusive for SMEC Students</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                      The Ultimate Arena for Coders
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-slate-200 mb-8">
                      Sharpen your skills, compete with peers, and climb the leaderboard. Welcome to the official competitive programming platform of St. Martin's Engineering College.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button size="lg" asChild>
                        <Link href="/register">Join the Battle</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black" asChild>
                        <Link href="/about">Learn More</Link>
                      </Button>
                    </div>
                </div>
            </div>
        </section>

        <section id="features" className="bg-slate-900 text-white py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">Why SMEC Battle Code?</h2>
              <p className="max-w-xl mx-auto text-slate-300 mt-4">
                We provide the tools and environment to help you succeed in your coding journey.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-8 bg-slate-800 rounded-lg shadow-lg border-2 border-transparent hover:border-sky-500 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="p-4 bg-sky-500/10 rounded-full mb-4">
                  <Code className="h-10 w-10 text-sky-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-World Challenges</h3>
                <p className="text-slate-400">
                  Solve problems that mirror technical interviews at top companies.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 bg-slate-800 rounded-lg shadow-lg border-2 border-transparent hover:border-amber-500 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="p-4 bg-amber-500/10 rounded-full mb-4">
                  <Trophy className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Compete & Climb</h3>
                <p className="text-slate-400">
                  Test your skills against fellow students and earn your spot on the leaderboard.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 bg-slate-800 rounded-lg shadow-lg border-2 border-transparent hover:border-emerald-500 transition-all duration-300 transform hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                  <BrainCircuit className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Master Key Concepts</h3>
                <p className="text-slate-400">
                  Strengthen your understanding of algorithms and data structures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="missions" className="bg-muted py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">Start Your Mission</h2>
              <p className="max-w-xl mx-auto text-muted-foreground mt-4">
                Challenges are organized by difficulty to guide your progress.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-card rounded-lg shadow-md border border-transparent hover:border-green-500 transition-colors animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-full">
                           <ListChecks className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Easy</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Perfect for beginners to get started with fundamental concepts and build confidence.</p>
                    <p className="text-sm font-semibold">Languages: C++, Java, Python, JS</p>
                </div>
                <div className="p-6 bg-card rounded-lg shadow-md border border-transparent hover:border-yellow-500 transition-colors animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <div className="flex items-center gap-4 mb-4">
                         <div className="p-2 bg-yellow-500/10 rounded-full">
                           <Send className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Medium</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Challenge your problem-solving skills with questions that require a solid grasp of data structures.</p>
                    <p className="text-sm font-semibold">Languages: C++, Java, Python, JS</p>
                </div>
                <div className="p-6 bg-card rounded-lg shadow-md border border-transparent hover:border-red-500 transition-colors animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                     <div className="flex items-center gap-4 mb-4">
                         <div className="p-2 bg-red-500/10 rounded-full">
                           <Flame className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold">Hard</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Test your limits with complex problems that demand advanced algorithmic knowledge and creativity.</p>
                    <p className="text-sm font-semibold">Languages: C++, Java, Python, JS</p>
                </div>
            </div>
            <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
                <Button size="lg" asChild>
                    <Link href="/register">Start a Mission</Link>
                </Button>
            </div>
          </div>
        </section>

        <section id="leaderboard-preview" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold">Ranking Arena</h2>
                    <p className="max-w-xl mx-auto text-muted-foreground mt-4">
                        See who's leading the charge. Can you dethrone them?
                    </p>
                </div>
                 {isLoading ? (
                    <div className="relative flex justify-center items-end gap-4 min-h-[320px]">
                        <Skeleton className="w-1/4 h-48" />
                        <Skeleton className="w-1/3 h-64" />
                        <Skeleton className="w-1/4 h-40" />
                    </div>
                 ) : (
                 <div className="relative flex justify-center items-end gap-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    {/* 2nd Place */}
                    {podiumUsers[0] && (
                    <div className="flex-1 flex flex-col items-center justify-end h-64">
                        <Trophy className="w-16 h-16 text-slate-400" />
                        <div className="bg-card w-full mt-4 p-4 rounded-t-lg shadow-lg text-center h-40 flex flex-col justify-end items-center">
                            <Avatar className="w-20 h-20 -mt-14 border-4 border-card">
                                <AvatarImage src={podiumUsers[0].imageUrl || "https://placehold.co/100x100.png"} />
                                <AvatarFallback>
                                    {podiumUsers[0].name ? podiumUsers[0].name.charAt(0) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-lg mt-2">{podiumUsers[0].name}</h3>
                            <div className="flex items-center gap-2">
                                <BulletCoin className="w-5 h-5" />
                                <span className="font-semibold text-lg">{podiumUsers[0].points.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    )}
                    {/* 1st Place */}
                    {podiumUsers[1] && (
                    <div className="flex-1 flex flex-col items-center justify-end h-80">
                         <Trophy className="w-24 h-24 text-yellow-400" />
                        <div className="bg-card w-full mt-4 p-4 rounded-t-lg shadow-lg text-center h-48 flex flex-col justify-end items-center">
                             <Avatar className="w-24 h-24 -mt-16 border-4 border-card">
                                <AvatarImage src={podiumUsers[1].imageUrl || "https://placehold.co/100x100.png"} />
                                <AvatarFallback>
                                    {podiumUsers[1].name ? podiumUsers[1].name.charAt(0) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-xl mt-2">{podiumUsers[1].name}</h3>
                             <div className="flex items-center gap-2">
                                <BulletCoin className="w-5 h-5" />
                                <span className="font-semibold text-xl">{podiumUsers[1].points.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    )}
                    {/* 3rd Place */}
                    {podiumUsers[2] && (
                    <div className="flex-1 flex flex-col items-center justify-end h-56">
                        <Trophy className="w-14 h-14 text-amber-600" />
                         <div className="bg-card w-full mt-4 p-4 rounded-t-lg shadow-lg text-center h-32 flex flex-col justify-end items-center">
                             <Avatar className="w-16 h-16 -mt-10 border-4 border-card">
                                <AvatarImage src={podiumUsers[2].imageUrl || "https://placehold.co/100x100.png"} />
                                <AvatarFallback>
                                    {podiumUsers[2].name ? podiumUsers[2].name.charAt(0) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-md mt-2">{podiumUsers[2].name}</h3>
                            <div className="flex items-center gap-2">
                                <BulletCoin className="w-5 h-5" />
                                <span className="font-semibold text-md">{podiumUsers[2].points.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
                 )}
                 <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/leaderboard">View Full Leaderboard</Link>
                    </Button>
                </div>
            </div>
        </section>

         <section id="rules" className="bg-muted py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold">Rules & Regulations</h2>
              <p className="max-w-xl mx-auto text-muted-foreground mt-4">
                A fair and competitive environment is key. Please follow the rules.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Gavel className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Plagiarism</h3>
                <p className="text-muted-foreground">
                  All submitted code must be your own original work. Any form of plagiarism will result in disqualification.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <BookCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Allowed Languages</h3>
                <p className="text-muted-foreground">
                  You can solve challenges in Python, Java, JavaScript, C, and C++. Choose the one you're most comfortable with.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fair Play</h3>
                <p className="text-muted-foreground">
                  Focus on the challenge. Navigating away from the editor tab during a challenge will result in a point penalty.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold">About the Battle</h2>
                    <p className="max-w-xl mx-auto text-muted-foreground mt-4">
                        Everything you need to know about the SMEC coding arena.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                          <Target className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Our Purpose</h3>
                        <p className="text-muted-foreground">
                            To provide a platform for SMEC students to test their programming skills, compete with peers, and prepare for real-world technical challenges in a fun and engaging way.
                        </p>
                    </div>
                     <div className="p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                        <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                          <Users className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Who Can Participate?</h3>
                        <p className="text-muted-foreground">
                            Participation is exclusive to the students of St. Martin's Engineering College. This is your personal arena to shine and showcase your talent.
                        </p>
                    </div>
                     <div className="p-8 bg-card rounded-lg shadow-md animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                        <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                          <Calendar className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Events & Timelines</h3>
                        <p className="text-muted-foreground">
                           Stay tuned for regular challenges, workshops, and special coding events. Keep an eye on the dashboard for all upcoming timelines and announcements.
                        </p>
                    </div>
                </div>
            </div>
        </section>

      </main>

       <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <Link href="/" className="flex items-center gap-2 font-semibold text-white mb-4">
                        <SmecBattleCodeLogo className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold">SMEC Battle Code</span>
                    </Link>
                    <p className="text-sm">The official competitive programming platform of St. Martin's Engineering College.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#features" className="hover:text-white">Features</a></li>
                        <li><a href="#missions" className="hover:text-white">Missions</a></li>
                        <li><a href="#rules" className="hover:text-white">Rules</a></li>
                        <li><Link href="/leaderboard" className="hover:text-white">Leaderboard</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-white mb-4">Contact</h4>
                     <ul className="space-y-2 text-sm">
                        <li><a href="mailto:contact@smec.ac.in" className="hover:text-white">contact@smec.ac.in</a></li>
                        <li><p>Dhulapally, Secunderabad, Telangana</p></li>
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-white">Twitter</a>
                        <a href="#" className="hover:text-white">LinkedIn</a>
                        <a href="#" className="hover:text-white">GitHub</a>
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} SMEC Battle Code. All Rights Reserved.</p>
                 <div className="mt-2">
                    <Link href="#" className="hover:text-white underline underline-offset-4">Terms of Service</Link>
                    <span className="mx-2">|</span>
                    <Link href="#" className="hover:text-white underline underline-offset-4">Privacy Policy</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
