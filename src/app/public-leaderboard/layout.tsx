
'use client';
import { Button } from '@/components/ui/button';
import { SmecBattleCodeLogo } from '@/components/icons';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
       <header className="container z-10 mx-auto flex items-center justify-between h-20 px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <SmecBattleCodeLogo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">SMEC Battle Code</span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-4">
                <Button asChild>
                    <Link href="/login">Login or Sign Up</Link>
                </Button>
            </nav>
        </header>
      <main className="flex-1">{children}</main>
       <footer className="bg-slate-900 text-slate-300 py-8">
            <div className="container mx-auto px-4 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} SMEC Battle Code. All Rights Reserved.</p>
            </div>
      </footer>
    </div>
  )
}
