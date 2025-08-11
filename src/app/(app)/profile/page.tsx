
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
import { User, Upload, Mail, KeyRound, LogOut, CaseSensitive, Loader2, Settings } from 'lucide-react';
import { getAuth, onAuthStateChanged, updateEmail, EmailAuthProvider, reauthenticateWithCredential, type User as FirebaseUser, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

type CurrentUser = {
  uid: string;
  name: string;
  email: string;
  studentId: string;
}

type ProfileData = {
    branch: string;
    year: string;
    section:string;
    imageUrl: string;
    preferredLanguages: string[];
}

const LANGUAGES = ['C', 'C++', 'Java', 'Python', 'JavaScript'];

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    branch: '',
    year: '',
    section: '',
    imageUrl: '',
    preferredLanguages: [],
  });
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
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
                const userEmail = user.email || userData.email;
                setCurrentUser({
                    uid: user.uid,
                    name: userData.name,
                    email: userEmail,
                    studentId: userData.studentId,
                });
                setNewEmail(userEmail);
                setProfile({
                    branch: userData.branch || '',
                    year: userData.year || '',
                    section: userData.section || '',
                    imageUrl: userData.imageUrl || '',
                    preferredLanguages: userData.preferredLanguages || [],
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
  
  const handleInputChange = (field: keyof Omit<ProfileData, 'imageUrl' | 'preferredLanguages'>, value: string) => {
      setProfile(prev => ({...prev, [field]: value}));
  }
  
  const handleLanguageChange = (language: string, checked: boolean) => {
    setProfile(prev => {
        const newLangs = checked 
            ? [...prev.preferredLanguages, language]
            : prev.preferredLanguages.filter(lang => lang !== language);
        return {...prev, preferredLanguages: newLangs};
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if(event.target?.result) {
            setProfile(prev => ({...prev, imageUrl: event.target.result as string}));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
        let finalImageUrl = profile.imageUrl;

        if (newImage && profile.imageUrl.startsWith('data:')) {
            const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
            const uploadResult = await uploadString(storageRef, profile.imageUrl, 'data_url');
            finalImageUrl = await getDownloadURL(uploadResult.ref);
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            branch: profile.branch,
            year: profile.year,
            section: profile.section,
            imageUrl: finalImageUrl,
            preferredLanguages: profile.preferredLanguages,
        });

        setProfile(prev => ({...prev, imageUrl: finalImageUrl}));
        
        toast({
            title: 'Profile Saved',
            description: 'Your profile information has been updated.',
        });
    } catch (error) {
        console.error("Error saving profile: ", error);
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save your profile.',
         });
    } finally {
        setIsSaving(false);
        setNewImage(null);
    }
  };

  const handleChangeEmail = async () => {
      if(!currentUser || !newEmail || !passwordForEmail) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all fields.' });
          return;
      }
      setIsChangingEmail(true);

      try {
          const user = auth.currentUser;
          if(!user) throw new Error("User not found");

          const credential = EmailAuthProvider.credential(user.email!, passwordForEmail);
          await reauthenticateWithCredential(user, credential);
          
          await updateEmail(user, newEmail);
          
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, { email: newEmail });

          setCurrentUser(prev => prev ? {...prev, email: newEmail} : null);
          setPasswordForEmail('');

          toast({
              title: 'Email Changed',
              description: `Your email has been updated. A verification link was sent to ${newEmail}.`,
          });
      } catch (error: any) {
          console.error("Error changing email: ", error);
          let description = 'Could not change your email.';
          if (error.code === 'auth/wrong-password') {
            description = 'Incorrect password. Please try again.';
          } else if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use by another account.';
          }
          toast({ variant: 'destructive', title: 'Error', description });
      } finally {
          setIsChangingEmail(false);
      }
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }
  
  if (!currentUser) return null;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your public profile details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profile.imageUrl} alt={currentUser.name} />
                          <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                        </Avatar>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Change Picture
                        </Button>
                        <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={currentUser.name} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label>Student ID</Label>
                            <Input value={currentUser.studentId} disabled />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Select value={profile.branch} onValueChange={(value) => handleInputChange('branch', value)}>
                            <SelectTrigger id="branch"><SelectValue placeholder="Select your branch" /></SelectTrigger>
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
                             <Select value={profile.year} onValueChange={(value) => handleInputChange('year', value)}>
                                <SelectTrigger id="year"><SelectValue placeholder="Select year" /></SelectTrigger>
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
                            <Select value={profile.section} onValueChange={(value) => handleInputChange('section', value)}>
                                <SelectTrigger id="section"><SelectValue placeholder="Select section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Section A</SelectItem>
                                    <SelectItem value="B">Section B</SelectItem>
                                    <SelectItem value="C">Section C</SelectItem>
                                    <SelectItem value="D">Section D</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Preferred Programming Languages</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border p-4">
                            {LANGUAGES.map(lang => (
                                <div key={lang} className="flex items-center gap-2">
                                    <Checkbox 
                                        id={`prof-lang-${lang}`}
                                        checked={profile.preferredLanguages.includes(lang)}
                                        onCheckedChange={(checked) => handleLanguageChange(lang, !!checked)}
                                    />
                                    <Label htmlFor={`prof-lang-${lang}`} className="font-normal">{lang}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <aside className="md:col-span-1 space-y-6">
            {/* Account Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Settings className="h-6 w-6"/> Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={currentUser.email} disabled className="mt-1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-email">Change Email Address</Label>
                        <Input id="new-email" type="email" placeholder="new.email@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-for-email">Current Password</Label>
                        <Input id="password-for-email" type="password" value={passwordForEmail} onChange={(e) => setPasswordForEmail(e.target.value)} />
                    </div>
                    <Button onClick={handleChangeEmail} disabled={isChangingEmail || newEmail === currentUser.email} className="w-full">
                        {isChangingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Updating...</> : 'Update Email'}
                    </Button>
                </CardContent>
            </Card>

            {/* Logout */}
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LogOut className="h-5 w-5"/> Logout</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Are you sure you want to log out of your account?</p>
                    <Button variant="destructive-outline" onClick={handleLogout} className="w-full">
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </aside>
      </div>
    </div>
  );
}
