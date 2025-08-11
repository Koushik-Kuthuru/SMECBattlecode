
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
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { SmecBattleCodeLogo } from '@/components/icons';
import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRegister = async () => {
    // Basic validation
    if (!fullName || !email || !password || !studentId || !confirmPassword) {
       toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'Please fill in all fields.',
        });
        return;
    }

    if (studentId.length !== 10) {
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'Student ID must be exactly 10 characters.',
        });
        return;
    }
    
    if (password !== confirmPassword) {
      toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'Passwords do not match.',
      });
      return;
    }
    
    if (!recaptchaToken) {
      toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'Please complete the reCAPTCHA verification.',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Verify reCAPTCHA token with our backend
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: recaptchaToken }),
      });

      const recaptchaData = await recaptchaResponse.json();

      if (!recaptchaData.success) {
          toast({
              variant: 'destructive',
              title: 'Registration Failed',
              description: 'Failed to verify reCAPTCHA. Please try again.',
          });
          setIsLoading(false);
          return;
      }

      // Check if student ID already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("studentId", "==", studentId.toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          toast({
              variant: 'destructive',
              title: 'Registration Failed',
              description: 'An account with this Student ID already exists.',
          });
          setIsLoading(false);
          return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send verification email
      await sendEmailVerification(user);

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: fullName });

      // Store additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        studentId: studentId.toUpperCase(),
        points: 0,
        profileComplete: false,
      });
      
      router.push('/complete-profile');
      toast({
        title: 'Account Created!',
        description: `Welcome, ${fullName}! Please complete your profile to continue.`,
      });


    } catch (error: any) {
        let description = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            description = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'Please enter a valid email address.';
        }
        console.error("Registration error:", error);
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentId(e.target.value.toUpperCase().slice(0, 10));
  };
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm border-0 shadow-none bg-transparent">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <SmecBattleCodeLogo className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-slate-600">Join SMEC Battlecode and start your coding journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input id="full-name" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
             <div className="grid gap-2">
              <Input id="student-id" placeholder="Student ID" required value={studentId} onChange={handleStudentIdChange} maxLength={10} />
            </div>
            <div className="relative grid gap-2">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
               <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7 text-muted-foreground" onClick={togglePasswordVisibility}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
             <div className="relative grid gap-2">
              <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Input id="email" type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
             
             <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={setRecaptchaToken}
             />

            <Button type="submit" className="w-full" onClick={handleRegister} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : 'Sign Up'}
            </Button>
          </div>
          <div className="mt-6 text-center text-sm">
            Have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
