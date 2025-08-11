
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { SmecBattleCodeLogo } from '@/components/icons';

function RecaptchaIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-10 w-10">
            <path fill="#4285F4" d="M39,24V9.2C39,8.5,38.5,8,37.8,8h-26C11.3,8,11,8.3,10.7,8.8l-5.9,9.9C4.3,19.6,4,20.6,4,21.7V37c0,1.1,0.9,2,2,2h20.5c0,0,0.1,0,0.1,0c0.3,0,0.6-0.1,0.8-0.3l11.4-11.4C39,27.1,39,25.6,39,24z"/>
            <path fill="#9C27B0" d="M38.8,38.8C38.6,39,38.3,39,38,39c-0.1,0-0.1,0-0.1,0H17.4c-0.7,0-1.4-0.6-1.4-1.4V25.9c0-0.5,0.4-1,1-1.1l11.7-2.1c0.5-0.1,1.1,0.2,1.2,0.8l1.7,7.8c0.2,0.8,1,1.3,1.8,1.2c0.8-0.2,1.3-1,1.2-1.8l-1.7-7.8c-0.4-2-2.3-3.2-4.2-2.8L16.5,21H14v-2h2.5c2.4,0,4.6,1.4,5.5,3.6l1.7,7.8c0.1,0.3,0.3,0.5,0.6,0.5c0.1,0,0.2,0,0.2,0c0.3-0.1,0.5-0.3,0.5-0.6l-1.7-7.8c-0.1-0.7,0.3-1.3,1-1.4l11.7-2.1c0.1,0,0.2,0,0.3,0c0.6,0,1.1,0.5,1,1.1l-1.4,6.4h2.5v2h-3.2L38.8,38.8z"/>
        </svg>
    )
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
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
    
    if (!isVerified) {
      toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'Please verify that you are not a robot.',
      });
      return;
    }
    
    setIsLoading(true);

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
             
             <div className="flex items-center justify-between space-x-2 my-2 p-3 rounded-md bg-gray-100 border border-gray-300">
                <div className="flex items-center gap-4">
                    <Checkbox id="robot-check" checked={isVerified} onCheckedChange={(checked) => setIsVerified(!!checked)} className="h-7 w-7" />
                    <Label htmlFor="robot-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                       I'm not a robot
                    </Label>
                </div>
                <div className="flex flex-col items-center">
                    <RecaptchaIcon />
                    <p className="text-xs text-gray-500">reCAPTCHA</p>
                    <p className="text-[10px] text-gray-400">Privacy - Terms</p>
                </div>
            </div>

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
