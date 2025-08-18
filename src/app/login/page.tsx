
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth-layout';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { SmecBattleCodeLogo } from '@/components/icons';

export default function LoginPage() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminLogin = searchParams.get('admin') === 'true';
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If user is already logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // Otherwise, show the login form
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    
    const isEmailLogin = isAdminLogin && studentId.includes('@');
    
    if ((!studentId && !isEmailLogin) || !password) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please fill in all fields.',
      });
      setIsLoading(false);
      return;
    }

    try {
      let userEmail = '';
      if (isEmailLogin) {
          userEmail = studentId; // For admin, studentId field holds email
      } else {
          // Find user by student ID in Firestore
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("studentId", "==", studentId.toUpperCase()));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Invalid Student ID or password.',
            });
            setIsLoading(false);
            return;
          }
          userEmail = querySnapshot.docs[0].data().email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      if (isAdminLogin) {
          if (!userData?.isAdmin) {
             toast({
                variant: 'destructive',
                title: 'Authorization Failed',
                description: 'You do not have permission to access the admin panel.',
             });
             await auth.signOut();
             setIsLoading(false);
             return;
          }
           localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: userData.name,
                isAdmin: true,
            }));
          router.push('/admin/dashboard');
          toast({ title: 'Admin Login Successful', description: `Welcome back, ${userData.name}!` });
      } else {
           if (userData?.isAdmin) {
              toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Please use the admin portal to log in.',
              });
               await auth.signOut();
              setIsLoading(false);
              return;
            }
          router.push('/dashboard');
          toast({ title: 'Login Successful', description: `Welcome back, ${userData.name}!` });
      }
      
    } catch (error) {
      console.error("Login Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdminLogin) {
        setStudentId(e.target.value);
    } else {
        setStudentId(e.target.value.toUpperCase().slice(0, 10));
    }
  };
  
  if (isCheckingAuth) {
    return (
        <AuthLayout>
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <div className="flex items-center gap-3">
                    <SmecBattleCodeLogo className="h-10 w-10 text-primary" />
                    <div>
                        <p className="font-bold leading-tight">SMEC</p>
                        <p className="text-xs text-muted-foreground leading-tight">{isAdminLogin ? 'Admin Panel' : 'Battlecode'}</p>
                    </div>
                </div>
            </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{isAdminLogin ? 'Admin Login' : 'Welcome Back!'}</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input 
                id="credential"
                placeholder={isAdminLogin ? 'Email Address' : 'Student ID'}
                required 
                value={studentId} 
                onChange={handleStudentIdChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">Password</Label>
              <Input id="password" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              {!isAdminLogin && (
                <Link href="/forgot-password" className="text-right inline-block text-sm text-primary hover:underline">
                    Forgot password?
                </Link>
              )}
            </div>
            
            <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
            </Button>
          </div>
          {!isAdminLogin && (
            <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                Sign up
                </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
