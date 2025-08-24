

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2, PlusCircle, Trash2, Edit, X, Calendar as CalendarIcon, Link2, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Challenge } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';

type Prize = { rank: string; details: string };

type FormData = Omit<Event, 'id' | 'createdAt' | 'startDate' | 'endDate' | 'status' | 'prizes' | 'color' | 'registeredUsers' | 'challengeIds'> & {
  slug: string;
  startDate: Date;
  endDate: Date;
  prizes: Prize[];
  color: string;
  challengeIds: string[];
};

const createSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
        .replace(/(^-|-$)+/g, '');   // Remove leading/trailing dashes
};

export default function ManageArenaPage() {
  const { toast } = useToast();
  const [contests, setContests] = useState<Event[]>([]);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  
  const defaultFormData: FormData = {
    slug: '',
    title: '',
    description: '',
    imageUrl: '',
    aiHint: '',
    type: 'Challenge',
    isEnabled: true,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    registrationLink: '',
    prizes: [],
    importantNotes: [],
    announcements: [],
    enrolled: 0,
    color: '#3b82f6',
    challengeIds: [],
  };

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  
  const db = getFirestore(app);
  const eventsCollectionRef = collection(db, 'events');
  const challengesCollectionRef = collection(db, 'challenges');

  useEffect(() => {
    const q = query(eventsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contestList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Event))
        .filter(event => event.type === 'Challenge'); // Only get Arena contests
      setContests(contestList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching contests:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load contests from Firestore.'
      });
      setIsLoading(false);
    });
    
    const challengesQuery = query(challengesCollectionRef, orderBy('title'));
    const unsubscribeChallenges = onSnapshot(challengesQuery, (snapshot) => {
        const challengesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
        setAllChallenges(challengesList);
    });

    return () => {
        unsubscribe();
        unsubscribeChallenges();
    }
  }, [db, toast]);

  const handleInputChange = useCallback((field: keyof Omit<FormData, 'startDate' | 'endDate' | 'prizes' | 'importantNotes' | 'announcements' | 'description' | 'challengeIds'>, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDynamicArrayChange = (arrayName: 'prizes' | 'importantNotes' | 'announcements', index: number, fieldOrValue: string, value?: string) => {
      setFormData(prev => {
          const newArray = [...(prev[arrayName] || [])];
          if (arrayName === 'prizes') {
              // @ts-ignore
              newArray[index] = {...newArray[index], [fieldOrValue]: value};
          } else {
              newArray[index] = fieldOrValue;
          }
          return {...prev, [arrayName]: newArray};
      });
  };

  const addDynamicArrayItem = (arrayName: 'prizes' | 'importantNotes' | 'announcements') => {
      setFormData(prev => ({
          ...prev,
          [arrayName]: [...(prev[arrayName] || []), arrayName === 'prizes' ? { rank: '', details: '' } : '']
      }));
  };

  const removeDynamicArrayItem = (arrayName: 'prizes' | 'importantNotes' | 'announcements', index: number) => {
      setFormData(prev => ({
          ...prev,
          // @ts-ignore
          [arrayName]: (prev[arrayName] || []).filter((_, i) => i !== index)
      }));
  };

  const handleDateTimeChange = (field: 'startDate' | 'endDate', value: Date | undefined, timePart: 'hour' | 'minute', timeValue: string) => {
      const newDate = value || formData[field];
      const numericValue = parseInt(timeValue, 10);
      if (isNaN(numericValue)) return;
      
      let updatedDate;
      if (timePart === 'hour') {
          updatedDate = setHours(newDate, numericValue);
      } else {
          updatedDate = setMinutes(newDate, numericValue);
      }
      setFormData(prev => ({ ...prev, [field]: updatedDate }));
  };

  const handleChallengeSelection = (challengeId: string, checked: boolean) => {
    setFormData(prev => {
        const newChallengeIds = checked
            ? [...prev.challengeIds, challengeId]
            : prev.challengeIds.filter(id => id !== challengeId);
        return { ...prev, challengeIds: newChallengeIds };
    });
  };

  const handleAddNewClick = () => {
    setEditingContestId(null);
    setFormData(defaultFormData);
    setIsFormVisible(true);
  };

  const handleEditClick = (event: Event) => {
    setEditingContestId(event.id);
    setFormData({
      ...defaultFormData,
      ...event,
      slug: event.id,
      description: '', // This field is removed
      startDate: event.startDate.toDate(),
      endDate: event.endDate.toDate(),
      prizes: event.prizes || [],
      importantNotes: event.importantNotes || [],
      announcements: event.announcements || [],
      enrolled: event.enrolled || 0,
      color: event.color || '#3b82f6',
      challengeIds: event.challengeIds || [],
    });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingContestId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const slug = formData.slug ? createSlug(formData.slug) : createSlug(formData.title);
    if (!slug) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not generate a valid slug from the title or provided slug.' });
        setIsSaving(false);
        return;
    }

    if (!editingContestId) {
        const docRef = doc(db, 'events', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            toast({
                variant: 'destructive',
                title: 'ID Exists',
                description: 'A contest with this slug already exists. Please choose a unique slug or title.'
            });
            setIsSaving(false);
            return;
        }
    }
    
    // Admin no longer sets enrolled count, but we need to preserve it if it exists.
    const currentRegisteredUsers = editingContestId ? (contests.find(c => c.id === editingContestId)?.registeredUsers || []) : [];

    const { description, slug: formSlug, ...restOfFormData } = formData;
    const dataToSave = {
        ...restOfFormData,
        startDate: Timestamp.fromDate(formData.startDate),
        endDate: Timestamp.fromDate(formData.endDate),
        type: 'Challenge' as const,
        registeredUsers: currentRegisteredUsers,
    };

    try {
      const docRef = doc(db, 'events', slug);
      if (editingContestId) {
        await setDoc(docRef, dataToSave, { merge: true });
        toast({
          title: 'Contest Updated!',
          description: 'The contest has been successfully updated.',
        });
      } else {
        await setDoc(docRef, { ...dataToSave, createdAt: serverTimestamp() });
        toast({
          title: 'Contest Added!',
          description: 'The new contest has been created.',
        });
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving contest:", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not save the contest to Firestore.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (contestId: string) => {
    if (!window.confirm("Are you sure you want to delete this contest?")) return;

    try {
      await deleteDoc(doc(db, "events", contestId));
      toast({
        title: "Contest Deleted",
        description: "The contest has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting contest: ", error);
      toast({
        variant: "destructive",
        title: "Error Deleting",
        description: "Could not delete the contest.",
      });
    }
  };

  const renderDateTimePicker = (field: 'startDate' | 'endDate') => (
     <div className="space-y-2">
      <Label htmlFor={field}>{field === 'startDate' ? 'Start Date & Time' : 'End Date & Time'}</Label>
      <div className="flex flex-col sm:flex-row gap-2">
         <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData[field] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData[field] ? format(formData[field], "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData[field]} onSelect={(d) => setFormData(prev => ({...prev, [field]: d || new Date()}))} initialFocus />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2">
            <Select onValueChange={(v) => handleDateTimeChange(field, undefined, 'hour', v)} defaultValue={String(formData[field].getHours())}>
                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({length: 24}, (_, i) => <SelectItem key={i} value={String(i)}>{String(i).padStart(2,'0')}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(v) => handleDateTimeChange(field, undefined, 'minute', v)} defaultValue={String(formData[field].getMinutes())}>
                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({length: 60}, (_, i) => <SelectItem key={i} value={String(i)}>{String(i).padStart(2,'0')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
      </div>
    </div>
  );
  
  if (isFormVisible) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle>{editingContestId ? 'Edit Contest' : 'Create New Contest'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>
              {editingContestId ? 'Update the details for this contest.' : 'Fill out the form to create a new contest.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor='title'>Title</Label>
                <Input id='title' placeholder="Contest Title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor='slug'>Slug (URL Identifier)</Label>
                <Input id='slug' placeholder="e.g., weekly-contest-1 (optional, auto-generated from title)" value={formData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} disabled={!!editingContestId} />
                {!editingContestId && <p className="text-xs text-muted-foreground">This will be the unique ID. If left empty, it's created from the title. Cannot be changed later.</p>}
              </div>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" placeholder="https://example.com/image.png" value={formData.imageUrl} onChange={(e) => handleInputChange('imageUrl', e.target.value)} required />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="aiHint">AI Hint (for image search)</Label>
                    <Input id="aiHint" placeholder="e.g., coding contest" value={formData.aiHint} onChange={(e) => handleInputChange('aiHint', e.target.value)} />
                 </div>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="color">Theme Color</Label>
                    <div className="flex items-center gap-2">
                        <Input id="color" type="color" value={formData.color} onChange={(e) => handleInputChange('color', e.target.value)} className="w-12 h-10 p-1" />
                        <Input value={formData.color} onChange={(e) => handleInputChange('color', e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="enrolled">Enrolled Count (initial)</Label>
                    <Input id="enrolled" type="number" placeholder="0" value={formData.enrolled} onChange={(e) => handleInputChange('enrolled', parseInt(e.target.value, 10) || 0)} required />
                 </div>
               </div>
              <div className="grid md:grid-cols-2 gap-6">
                {renderDateTimePicker('startDate')}
                {renderDateTimePicker('endDate')}
              </div>

               <div className="space-y-4">
                  <Label>Important Notes</Label>
                  {(formData.importantNotes || []).map((note, index) => (
                    <div key={index} className="flex items-center gap-2">
                       <Textarea value={note} onChange={(e) => handleDynamicArrayChange('importantNotes', index, e.target.value)} placeholder={`Note #${index + 1}`} />
                       <Button type="button" variant="destructive" size="icon" onClick={() => removeDynamicArrayItem('importantNotes', index)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addDynamicArrayItem('importantNotes')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Note
                  </Button>
                </div>
                
                 <div className="space-y-4">
                  <Label>Announcements</Label>
                  {(formData.announcements || []).map((announcement, index) => (
                    <div key={index} className="flex items-center gap-2">
                       <Textarea value={announcement} onChange={(e) => handleDynamicArrayChange('announcements', index, e.target.value)} placeholder={`Announcement #${index + 1}`} />
                       <Button type="button" variant="destructive" size="icon" onClick={() => removeDynamicArrayItem('announcements', index)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addDynamicArrayItem('announcements')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Announcement
                  </Button>
                </div>

                <div className="space-y-4">
                   <Label>Prizes</Label>
                   {(formData.prizes || []).map((prize, index) => (
                     <Card key={index} className="p-4 relative bg-muted/50">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input value={prize.rank} onChange={(e) => handleDynamicArrayChange('prizes', index, 'rank', e.target.value)} placeholder="e.g., 1st Prize" />
                            <Input value={prize.details} onChange={(e) => handleDynamicArrayChange('prizes', index, 'details', e.target.value)} placeholder="e.g., 5000 Coins" />
                        </div>
                       <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeDynamicArrayItem('prizes', index)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </Card>
                   ))}
                   <Button type="button" variant="outline" onClick={() => addDynamicArrayItem('prizes')}>
                     <PlusCircle className="mr-2 h-4 w-4" /> Add Prize Row
                   </Button>
                </div>

                <div className="space-y-4">
                    <Label>Contest Challenges (select 4)</Label>
                    <Card className="max-h-60 overflow-y-auto p-4">
                        <div className="space-y-2">
                            {allChallenges.map(challenge => (
                                <div key={challenge.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`challenge-${challenge.id}`}
                                        checked={formData.challengeIds.includes(challenge.id!)}
                                        onCheckedChange={(checked) => handleChallengeSelection(challenge.id!, !!checked)}
                                        disabled={!formData.challengeIds.includes(challenge.id!) && formData.challengeIds.length >= 4}
                                    />
                                    <Label htmlFor={`challenge-${challenge.id}`} className="font-normal">{challenge.title}</Label>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <p className="text-sm text-muted-foreground">{formData.challengeIds.length} / 4 selected</p>
                </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch id="isEnabled" checked={formData.isEnabled} onCheckedChange={(checked) => handleInputChange('isEnabled', checked)} />
                <Label htmlFor="isEnabled">Enable this contest</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {isSaving ? 'Saving...' : (editingContestId ? 'Save Changes' : 'Create Contest')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Arena Contests</h1>
        <Button onClick={handleAddNewClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Contest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Contests</CardTitle>
          <CardDescription>
            Manage the contests that appear on the public arena page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
               <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : contests.length > 0 ? (
            <div className="space-y-4">
              {contests.map(event => (
                <div key={event.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
                  <div className="flex items-center gap-4">
                      <img src={event.imageUrl || 'https://placehold.co/64'} alt={event.title} className="w-16 h-16 object-cover rounded-md bg-muted" />
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{event.type} - Starts {format(event.startDate.toDate(), "PPP")}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={event.isEnabled ? 'default' : 'secondary'}>{event.isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}>
                             <Edit className="mr-2 h-4 w-4" />
                             Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}>
                             <Trash2 className="mr-2 h-4 w-4" />
                             Delete
                        </Button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
                No contests found. Click "Add New Contest" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
