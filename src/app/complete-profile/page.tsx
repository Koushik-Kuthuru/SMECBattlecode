
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Loader2, Check } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { AuthLayout } from '@/components/auth-layout';

type CurrentUser = {
  uid: string;
  name: string;
  email: string;
  studentId: string;
};

type ProfileData = {
  branch: string;
  year: string;
  section: string;
  imageUrl: string;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    branch: '',
    year: '',
    section: '',
    imageUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.profileComplete) {
            router.push('/dashboard');
            return;
          }
          setCurrentUser({
            uid: user.uid,
            name: userData.name,
            email: userData.email,
            studentId: userData.studentId,
          });
          setProfile({
            branch: userData.branch || '',
            year: userData.year || '',
            section: userData.section || '',
            imageUrl: userData.imageUrl || '',
          });
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const handleInputChange = (field: keyof Omit<ProfileData, 'imageUrl'>, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const dataUrl = event.target.result as string;
        setProfile((prev) => ({ ...prev, imageUrl: dataUrl })); // Show preview immediately

        setIsSaving(true);
        toast({ title: 'Uploading...', description: 'Your new profile picture is being uploaded.' });
        try {
          const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
          const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
          const finalImageUrl = await getDownloadURL(uploadResult.ref);
          setProfile((prev) => ({ ...prev, imageUrl: finalImageUrl }));
          toast({ title: 'Image Uploaded!', description: 'Your picture is ready.' });
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your new picture.' });
        } finally {
          setIsSaving(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profile.branch || !profile.year || !profile.section) {
        toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please fill out all fields.' });
        return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...profile,
        profileComplete: true,
      });

      toast({
        title: 'Profile Complete!',
        description: 'Welcome to SMEC Battle Code!',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome, {currentUser.name}! Please provide a few more details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.imageUrl} alt={currentUser.name} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                {profile.imageUrl ? 'Change Picture' : 'Upload Picture'}
              </Button>
              <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={profile.branch} onValueChange={(value) => handleInputChange('branch', value)} required>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">Computer Science Engineering</SelectItem>
                  <SelectItem value="csd">CSE (Data Science)</SelectItem>
                  <SelectItem value="cse_aiml">CSE (AI & ML)</SelectItem>
                  <SelectItem value="aiml">AI & Machine Learning</SelectItem>
                  <SelectItem value="aids">AI & Data Science</SelectItem>
                  <SelectItem value="it">Information Technology</SelectItem>
                  <SelectItem value="ece">Electronics & Communication</SelectItem>
                  <SelectItem value="eee">Electrical & Electronics</SelectItem>
                  <SelectItem value="mech">Mechanical Engineering</SelectItem>
                  <SelectItem value="civil">Civil Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={profile.year} onValueChange={(value) => handleInputChange('year', value)} required>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={profile.section} onValueChange={(value) => handleInputChange('section', value)} required>
                  <SelectTrigger id="section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                    <SelectItem value="D">Section D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
