
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth-layout';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [studentId, setStudentId] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const auth = getAuth(app);

  const handlePasswordReset = async () => {
    if (!studentId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your Student ID.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("studentId", "==", studentId.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No account found with that Student ID.',
        });
        setIsLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userEmail = userDoc.data().email;

      await sendPasswordResetEmail(auth, userEmail);
      setSentToEmail(userEmail);
      setIsSent(true);
    } catch (error: any) {
      console.error("Password Reset Error: ", error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send password reset email. Please check the ID and try again.',
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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
          <CardDescription>
            {isSent
              ? `A password reset link has been sent to your registered email: ${sentToEmail}.`
              : 'No problem. Enter your Student ID and we’ll send you a link to reset it.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <Button className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  type="text"
                  placeholder="YOUR_ID"
                  required
                  value={studentId}
                  onChange={handleStudentIdChange}
                />
              </div>
              <Button type="submit" className="w-full" onClick={handlePasswordReset} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login">Cancel</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
