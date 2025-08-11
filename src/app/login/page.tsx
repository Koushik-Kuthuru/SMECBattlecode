
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth-layout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { SmecBattleCodeLogo } from '@/components/icons';
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleLogin = async () => {
    setIsLoading(true);
    
    if (!studentId || !password) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please fill in all fields.',
      });
      setIsLoading(false);
      return;
    }

    if (!recaptchaToken) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Please complete the reCAPTCHA verification.',
        });
        setIsLoading(false);
        return;
    }

    try {
      // Verify reCAPTCHA token
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
      });
      const recaptchaData = await recaptchaResponse.json();
      if (!recaptchaData.success) {
          toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Failed to verify reCAPTCHA. Please try again.',
          });
          setIsLoading(false);
          return;
      }

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
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isAdmin) {
          toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Please use the admin portal to log in.',
        });
        setIsLoading(false);
        return;
      }

      const userEmail = userData.email;

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      
      router.push('/dashboard');
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name}!`,
      });

    } catch (error) {
      console.error("Login Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid Student ID or password.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentId(e.target.value.toUpperCase().slice(0, 10));
  };


  return (
    <AuthLayout>
      <Card className="w-full max-w-sm border-0 shadow-none bg-transparent">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <div className="flex items-center gap-3">
                    <SmecBattleCodeLogo className="h-10 w-10 text-primary" />
                    <div>
                        <p className="font-bold leading-tight">SMEC</p>
                        <p className="text-xs text-slate-500 leading-tight">Battlecode</p>
                    </div>
                </div>
            </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back!</CardTitle>
          <CardDescription className="text-slate-600">Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input id="student-id" placeholder="Student ID" required value={studentId} onChange={handleStudentIdChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">Password</Label>
              <Input id="password" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <Link href="/forgot-password" className="text-right inline-block text-sm text-primary hover:underline">
                  Forgot your password?
              </Link>
            </div>
            
            <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={setRecaptchaToken}
            />

            <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
            </Button>
          </div>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
