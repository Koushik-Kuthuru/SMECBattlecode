
'use client'

import { SmecBattleCodeLogo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Home, LogOut, Settings, User, Trophy, ArrowRight, Menu, Flame, ListChecks, Users, Megaphone, CalendarDays, ShieldAlert, Server } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Toaster } from '@/components/ui/toaster';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !user.isAdmin) {
        router.push('/admin-login');
    } else {
        setCurrentUser(user);
    }
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/');
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/challenges', label: 'Manage Challenges', icon: ListChecks },
    { href: '/admin/users', label: 'Manage Users', icon: Users },
    { href: '/admin/advertisement', label: 'Manage Ads', icon: Megaphone },
    { href: '/admin/events', label: 'Manage Events', icon: CalendarDays },
    { href: '/admin/cheating-detection', label: 'Cheating Detection', icon: ShieldAlert },
    { href: '/admin/server-health', label: 'Server Health', icon: Server },
  ];
  
  if (isLoading || !currentUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Loading...
        </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex-col hidden md:flex">
           <div className="p-4 flex items-center justify-center h-20 mb-4">
             <Link href="/admin/dashboard" className="flex items-center gap-3">
                <SmecBattleCodeLogo className="h-10 w-10 text-primary" />
                <div>
                    <p className="font-bold leading-tight">SMEC</p>
                    <p className="text-xs text-slate-300 leading-tight">Admin</p>
                </div>
              </Link>
           </div>
            <ScrollArea className="flex-1 px-4">
                <nav className="flex flex-col gap-2">
                     {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-800',
                            pathname.startsWith(link.href) ? 'bg-slate-700' : 'text-slate-300'
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                </nav>
            </ScrollArea>
            
            <div className="mt-auto flex flex-col gap-4 p-4">
                 <div className="flex items-center justify-start">
                     <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-slate-800 hover:text-white">
                        <LogOut className="h-5 w-5" />
                     </Button>
                 </div>
                 <div className="border-t border-slate-700 pt-4">
                     <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <User />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">{currentUser.email}</p>
                          </div>
                     </div>
                 </div>
            </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white">
           <h1 className="text-xl font-bold">Admin Menu</h1>
           <div className="flex items-center gap-4">
              <Sheet>
                 <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12">
                        <Menu className="h-7 w-7" />
                    </Button>
                 </SheetTrigger>
                 <SheetContent side="right" className="bg-slate-900 text-white w-64 p-4">
                    <SheetHeader>
                      <SheetTitle className="text-white">Admin Navigation</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 mt-8">
                       {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-800',
                            pathname.startsWith(link.href) ? 'bg-slate-700' : 'text-slate-300'
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                     <div className="mt-auto flex flex-col gap-4 absolute bottom-4 right-4 left-4">
                         <div className="flex items-center justify-start">
                             <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-slate-800 hover:text-white">
                                <LogOut className="h-5 w-5" />
                             </Button>
                         </div>
                     </div>
                 </SheetContent>
              </Sheet>
           </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
             <ScrollArea className="flex-1">
                <main className="bg-muted/40 p-4 md:p-8">{children}</main>
            </ScrollArea>
        </div>
        <Toaster />
    </div>
  );
}
