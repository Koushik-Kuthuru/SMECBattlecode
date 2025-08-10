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
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRegister = async () => {
    setIsLoading(true);
    // Basic validation
    if (!fullName || !email || !password || !studentId || studentId.length !== 10) {
       toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: studentId.length !== 10 ? 'Student ID must be exactly 10 characters.' : 'Please fill in all fields.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
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
        profileComplete: false, // Add this flag
      });
      
      // Redirect to complete profile page instead of login
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


  return (
    <AuthLayout>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-300 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription className="text-slate-600">Join SMEC Battle Code and start your coding journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input id="student-id" placeholder="Your_Student_ID" required value={studentId} onChange={handleStudentIdChange} maxLength={10} className="bg-white/50" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/50" />
            </div>
            <Button type="submit" className="w-full" onClick={handleRegister} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : 'Create Account'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
