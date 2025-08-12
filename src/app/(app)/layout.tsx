

'use client'

import { SmecBattleCodeLogo, BulletCoin } from '@/components/icons';
import { cn } from '@/lib/utils';
import { BarChart, Home, Info, LogOut, Settings, User, Trophy, ArrowRight, Menu, Flame, Calendar } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, orderBy, query, limit, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Toaster } from '@/components/ui/toaster';

type CurrentUser = {
  uid: string;
  name: string;
  email: string;
  imageUrl?: string;
  isAdmin?: boolean;
}

type UserStats = {
  rank: number;
  points: number;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.isAdmin) {
             localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: userData.email,
                name: userData.name,
                isAdmin: true,
            }));
            router.push('/admin/dashboard');
            return;
          }
          
          setCurrentUser({
            uid: user.uid,
            name: userData.name,
            email: userData.email,
            imageUrl: userData.imageUrl,
          });

          // Fetch leaderboard to calculate rank
          const usersCollection = collection(db, 'users');
          const q = query(usersCollection, orderBy('points', 'desc'));
          const querySnapshot = await getDocs(q);
          
          let rank = 0;
          querySnapshot.docs.forEach((doc, index) => {
            if (doc.id === user.uid) {
              rank = index + 1;
            }
          });
          setUserStats({ rank, points: userData.points || 0 });

        } else {
           // This case might happen if a user is created in Auth but not in Firestore
           // Or if the admin logic needs adjustment. For now, we log out.
           await signOut(auth);
           router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  // Effect to update user's lastSeen timestamp
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    const updateLastSeen = () => {
        updateDoc(userDocRef, {
            lastSeen: serverTimestamp(),
        }).catch(console.error);
    };

    updateLastSeen(); // Update once on load

    const intervalId = setInterval(updateLastSeen, 60 * 1000); // Update every 60 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, db]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('currentUser'); // For admin logout
    router.push('/');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/missions', label: 'Missions', icon: Flame },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/about', label: 'About', icon: Info },
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
           <div className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold px-2 mb-8">
                <SmecBattleCodeLogo className="h-8 w-8" />
                <span className="text-xl">SMEC Battle Code</span>
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
                            pathname === link.href ? 'bg-slate-700' : 'text-slate-300'
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                </nav>
            </ScrollArea>
            
            <div className="mt-auto flex flex-col gap-4 p-4">
                 
                 <div className="border-t border-slate-700 pt-4">
                     <Link href="/profile" className="flex items-center gap-3">
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
                            <AvatarFallback>
                              <User />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">{currentUser.email}</p>
                          </div>
                     </Link>
                 </div>
            </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white">
           <h1 className="text-xl font-bold">Welcome 👋</h1>
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
                            pathname === link.href ? 'bg-slate-700' : 'text-slate-300'
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                     <div className="mt-auto flex flex-col gap-4 absolute bottom-4 right-4 left-4">
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

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden sticky bottom-0 left-0 right-0 bg-slate-900 text-white border-t border-slate-700 flex justify-around p-2">
             {navLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all w-20',
                    pathname === link.href ? 'text-primary' : 'text-slate-400'
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="text-xs">{link.label}</span>
                </Link>
              ))}
        </nav>
        <Toaster />
    </div>
  );
}
