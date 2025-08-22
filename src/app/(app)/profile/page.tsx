
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, Mail, KeyRound, LogOut, CaseSensitive, Loader2, Settings, List, CheckCircle, BarChart2 } from 'lucide-react';
import { getAuth, onAuthStateChanged, updateEmail, EmailAuthProvider, reauthenticateWithCredential, type User as FirebaseUser, signOut, verifyBeforeUpdateEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { app, db } from '@/lib/firebase';
import { Separator } from '@/components/ui/separator';
import { UserData, Submission, Challenge } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { BulletCoin } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ProfileData = {
    branch: string;
    year: string;
    section:string;
    imageUrl: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    branch: '',
    year: '',
    section: '',
    imageUrl: '',
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [newEmail, setNewEmail] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = getAuth(app);
  const storage = getStorage(app);

  const saveProfileData = useCallback(async (dataToSave: Partial<ProfileData>) => {
    if (!currentUser) return;
    setIsSaving(true);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, dataToSave);
      toast({
        title: 'Profile Saved',
        description: 'Your profile has been automatically updated.',
      });
    } catch (error) {
      console.error("Error auto-saving profile: ", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your changes.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, db, toast]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserData;
                    const userEmail = user.email || userData.email;
                    setCurrentUser({ ...userData, uid: user.uid, email: userEmail });
                    setNewEmail(userEmail);
                    setProfile({
                        branch: userData.branch || '',
                        year: userData.year || '',
                        section: userData.section || '',
                        imageUrl: userData.imageUrl || '',
                    });
                } else {
                    router.push('/login');
                }
                 setIsLoading(false);
            });

            // Fetch recent submissions
            const submissionsRef = collection(db, `users/${user.uid}/submissions`);
            const q = query(submissionsRef, orderBy('timestamp', 'desc'), limit(5));
            const unsubscribeSubmissions = onSnapshot(q, async (querySnapshot) => {
                const subs: Submission[] = [];
                const challengeIds = new Set<string>();

                querySnapshot.forEach(doc => {
                    const subData = doc.data() as Submission;
                    subs.push({ ...subData, id: doc.id });
                    if(subData.challengeId) challengeIds.add(subData.challengeId);
                });
                
                // Fetch challenge details for the submissions
                if(challengeIds.size > 0) {
                    const challengesData: Record<string, Challenge> = {};
                    for (const id of Array.from(challengeIds)) {
                         const challengeDoc = await getDoc(doc(db, 'challenges', id));
                         if(challengeDoc.exists()) {
                            challengesData[id] = challengeDoc.data() as Challenge;
                         }
                    }
                    setChallenges(challengesData);
                }
                setSubmissions(subs);
            });

            return () => {
                unsubscribeUser();
                unsubscribeSubmissions();
            }
        } else {
            router.push('/login');
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [auth, db, router]);
  
  const handleInputChange = async (field: keyof ProfileData, value: string) => {
      setProfile(prev => ({...prev, [field]: value}));
      await saveProfileData({[field]: value});
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      if(event.target?.result && typeof event.target.result === 'string') {
        const dataUrl = event.target.result as string;
        setProfile(prev => ({...prev, imageUrl: dataUrl})); // Show preview immediately

        setIsSaving(true);
        toast({ title: 'Uploading...', description: 'Your new profile picture is being uploaded.' });
        try {
            const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
            const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
            const finalImageUrl = await getDownloadURL(uploadResult.ref);

            await saveProfileData({ imageUrl: finalImageUrl });
            
            setProfile(prev => ({...prev, imageUrl: finalImageUrl}));
        } catch (error: any) {
            console.error("Error uploading image:", error);
            let description = 'Could not upload your new picture.';
            if (error.code === 'storage/retry-limit-exceeded' || error.code === 'storage/unauthorized') {
                description = 'Image upload failed. Please check your Firebase Storage security rules to allow uploads.';
            }
            toast({ variant: 'destructive', title: 'Upload Failed', description: description, duration: 8000 });
        } finally {
            setIsSaving(false);
        }
      }
    };
    reader.readAsDataURL(file);
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
          
          await verifyBeforeUpdateEmail(user, newEmail);

          setPasswordForEmail('');

          toast({
              title: 'Verification Required',
              description: `A verification link has been sent to ${newEmail}. Please check your inbox to complete the email change.`,
              duration: 8000,
          });
      } catch (error: any) {
          console.error("Error changing email: ", error);
          let description = 'Could not change your email.';
          if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
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
    router.push('/');
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
    <div className="container mx-auto max-w-6xl py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
           <Card>
                <CardHeader className="items-center text-center">
                     <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                        <AvatarImage src={profile.imageUrl} alt={currentUser.name} />
                        <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                    </Avatar>
                    <CardTitle>{currentUser.name}</CardTitle>
                    <CardDescription>{currentUser.studentId}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isSaving ? 'Uploading...' : 'Change Picture'}
                    </Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your public profile details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>

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
                    <Separator />
                     <Button variant="destructive-outline" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Your performance at a glance.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <BulletCoin className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                            <p className="text-2xl font-bold">{currentUser.points}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Challenges Solved</p>
                            <p className="text-2xl font-bold">{Object.keys(submissions).length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                    <CardDescription>Your latest attempts on challenges.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Challenge</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Language</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length > 0 ? submissions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{challenges[sub.challengeId]?.title || 'Unknown Challenge'}</TableCell>
                                    <TableCell>
                                         <Badge variant={sub.status === 'Accepted' ? 'default' : 'destructive'} className={sub.status === 'Accepted' ? 'bg-green-600' : ''}>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{sub.language}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {sub.timestamp ? formatDistanceToNow(sub.timestamp.toDate(), { addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No submissions yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
