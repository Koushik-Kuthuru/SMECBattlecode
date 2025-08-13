
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
import { User as UserIcon, Upload, Loader2, AlertCircle } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { SmecBattleCodeLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

type ProfileData = {
  branch: string;
  year: string;
  section: string;
  imageUrl: string;
  imageFile: File | null;
  preferredLanguages: string[];
};

const LANGUAGES = ['C', 'C++', 'Java', 'Python', 'JavaScript'];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    branch: '',
    year: '',
    section: '',
    imageUrl: '',
    imageFile: null,
    preferredLanguages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profileComplete) {
          router.push('/dashboard');
        } else {
          setUser(currentUser);
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const handleInputChange = (field: keyof Omit<ProfileData, 'imageUrl' | 'imageFile' | 'preferredLanguages'>, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };
  
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
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile((prev) => ({
            ...prev,
            imageUrl: event.target.result as string, // This is the base64 data URL for preview
            imageFile: file,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!profile.branch || !profile.year || !profile.section || !profile.imageFile || profile.preferredLanguages.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all the fields, including profile picture and preferred languages.' });
        return;
    }
    
    setIsSaving(true);
    
    try {
      let finalImageUrl = '';
      if (profile.imageUrl && profile.imageFile) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const uploadResult = await uploadString(storageRef, profile.imageUrl, 'data_url');
        finalImageUrl = await getDownloadURL(uploadResult.ref);
      } else {
        // Fallback or handle error if image is mandatory and not provided
        toast({ variant: 'destructive', title: 'Error', description: 'Profile picture is required.' });
        setIsSaving(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        branch: profile.branch,
        year: profile.year,
        section: profile.section,
        imageUrl: finalImageUrl,
        profileComplete: true,
        preferredLanguages: profile.preferredLanguages,
      });
      
      toast({ title: 'Profile Saved!', description: 'Your profile has been updated successfully.' });
      router.push('/dashboard');

    } catch (error) {
      console.error("Error saving profile: ", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Profile',
        description: 'Could not save your profile. Please try again later.',
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) return null;


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <SmecBattleCodeLogo className="h-16 w-16 text-primary" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide a few more details to finish setting up your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28">
                <AvatarImage src={profile.imageUrl} alt="User Profile" />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Picture
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={profile.branch} onValueChange={(value) => handleInputChange('branch', value)}>
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
                <Select value={profile.year} onValueChange={(value) => handleInputChange('year', value)}>
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
                <Select value={profile.section} onValueChange={(value) => handleInputChange('section', value)}>
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
            
            <div className="space-y-2">
                <Label>Preferred Programming Languages</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                    {LANGUAGES.map(lang => (
                        <div key={lang} className="flex items-center gap-2">
                            <Checkbox 
                                id={`lang-${lang}`}
                                checked={profile.preferredLanguages.includes(lang)}
                                onCheckedChange={(checked) => handleLanguageChange(lang, !!checked)}
                            />
                            <Label htmlFor={`lang-${lang}`} className="font-normal">{lang}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save and Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
