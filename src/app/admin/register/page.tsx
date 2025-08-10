
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
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function AdminRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleRegister = async () => {
    setIsLoading(true);
    if (!fullName || !email || !password || !adminCode) {
       toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'Please fill in all fields.',
        });
        setIsLoading(false);
        return;
    }
    
    // This is a simple check. In a real application, this should be more secure.
    if (adminCode !== 'SMEC_ADMIN_SECRET') {
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: 'Invalid admin code provided.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: email,
        isAdmin: true, // Set the admin flag
        studentId: `ADMIN_${Date.now()}` // Generate a unique ID for admin
      });
      
      router.push('/admin-login');
      toast({
        title: 'Admin Registration Successful!',
        description: `Admin account for ${fullName} created. You can now log in.`,
      });


    } catch (error: any) {
        let description = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            description = 'Password should be at least 6 characters.';
        }
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Admin Account</CardTitle>
          <CardDescription>Enter the details below to create a new administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="Admin Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="admin-code">Admin Secret Code</Label>
              <Input id="admin-code" type="password" required value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" onClick={handleRegister} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
             <Button variant="link" asChild>
                <Link href="/admin-login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
