
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SmecBattleCodeLogo } from '@/components/icons';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-20 bg-transparent text-white">
        <div className="container mx-auto flex items-center justify-between h-20 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <SmecBattleCodeLogo className="h-8 w-8" />
            <span className="text-xl font-bold">SMEC Battle Code</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/missions" className="hover:text-gray-300 transition-colors">Missions</Link>
            <Link href="/leaderboard" className="hover:text-gray-300 transition-colors">Leaderboard</Link>
            <Link href="/events" className="hover:text-gray-300 transition-colors">Events</Link>
             <Link href="/login" className="hover:text-gray-300 transition-colors">Sign In</Link>
          </nav>
           <div className="md:hidden">
            <Button asChild>
                <Link href="/login">Sign In</Link>
            </Button>
           </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[#282828] text-white">
          <div className="container mx-auto grid md:grid-cols-2 items-center gap-8 min-h-[70vh] md:min-h-[80vh] pt-24 pb-12 px-4 md:px-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">A New Way to Learn</h1>
                <p className="max-w-md text-lg text-gray-300 mb-8">
                  SMEC Battle Code is the best platform to help you enhance your skills, expand your knowledge and prepare for technical interviews.
                </p>
                <Button size="lg" asChild className="bg-teal-500 hover:bg-teal-600">
                    <Link href="/register">Create Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
            <div className="relative flex justify-center items-center">
              <Image 
                src="https://placehold.co/800x600.png" 
                alt="Platform dashboard illustration"
                width={800}
                height={600}
                className="rounded-lg shadow-2xl transform md:rotate-[-6deg] transition-transform hover:rotate-[-3deg]"
                data-ai-hint="dashboard computer screen"
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white to-transparent" style={{ transform: 'skewY(-3deg)', transformOrigin: 'bottom left' }} />
        </section>

        {/* Start Exploring Section */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 items-center gap-16">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-gray-800">Start Exploring</h2>
                     <div className="p-3 bg-teal-100 rounded-full">
                         <GraduationCap className="h-6 w-6 text-teal-600" />
                     </div>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Explore is a well-organized tool that helps you get the most out of SMEC Battle Code by providing structure to guide your progress towards the next step in your programming career.
                </p>
                <Button variant="link" asChild className="text-teal-600 text-lg p-0">
                    <Link href="/missions">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div>
                  <Image 
                    src="https://placehold.co/600x400.png"
                    alt="Abstract UI cards"
                    width={600}
                    height={400}
                    className="rounded-lg"
                    data-ai-hint="ui cards abstract"
                  />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-600 py-8">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} SMEC Battle Code. All Rights Reserved.</p>
             <div className="mt-2 text-sm">
                <Link href="/register" className="hover:text-gray-900 underline underline-offset-4">Terms of Service</Link>
                <span className="mx-2">|</span>
                <Link href="/register" className="hover:text-gray-900 underline underline-offset-4">Privacy Policy</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
