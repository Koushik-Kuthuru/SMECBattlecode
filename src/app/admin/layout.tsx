

'use client'

import { SmecBattleCodeLogo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Home, LogOut, Moon, Settings, Sun, User, Trophy, ArrowRight, Menu, Flame, ListChecks, Users, Megaphone, Calendar } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, isAdmin?: boolean} | null>(null);
  const { setTheme, theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user || !user.isAdmin) {
            router.push('/admin-login');
        } else {
            setCurrentUser(user);
        }
    }
  }, [pathname, router, isClient]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    router.push('/admin-login');
  }

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/admin/challenges', label: 'Manage Challenges', icon: ListChecks },
    { href: '/admin/users', label: 'Manage Users', icon: Users },
    { href: '/admin/events', label: 'Manage Events', icon: Calendar },
    { href: '/admin/advertisement', label: 'Manage Advertisement', icon: Megaphone },
  ];
  
  if (!isClient || !currentUser) {
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
           <div className="p-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold px-2 mb-8">
                <SmecBattleCodeLogo className="h-8 w-8" />
                <span className="text-xl">SMEC Admin</span>
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
                 <div className="flex items-center justify-between">
                     <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-slate-800 hover:text-white">
                        <LogOut className="h-5 w-5" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                         className="text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
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
                         <div className="flex items-center justify-between">
                             <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-slate-800 hover:text-white">
                                <LogOut className="h-5 w-5" />
                             </Button>
                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                 className="text-slate-300 hover:bg-slate-800 hover:text-white"
                              >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
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
    </div>
  );
}
