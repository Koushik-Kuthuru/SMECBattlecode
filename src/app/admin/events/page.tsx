
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
import { Loader2, PlusCircle, Trash2, Edit, X, Calendar as CalendarIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


type FormData = Omit<Event, 'id' | 'createdAt' | 'startDate' | 'endDate' | 'status'> & {
  slug: string;
  startDate: Date;
  endDate: Date;
};

const defaultFormData: FormData = {
  slug: '',
  title: '',
  description: '',
  imageUrl: '',
  aiHint: '',
  type: 'Workshop',
  enrolled: 0,
  isEnabled: true,
  startDate: new Date(),
  endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
  registrationLink: '',
  prizes: [],
};

const createSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
        .replace(/(^-|-$)+/g, '');   // Remove leading/trailing dashes
};


export default function ManageEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  const db = getFirestore(app);
  const eventsCollectionRef = collection(db, 'events');

  useEffect(() => {
    const q = query(eventsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Event))
        .filter(event => event.type !== 'Challenge'); // Filter out Arena contests
      setEvents(eventsList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load events from Firestore.'
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleInputChange = useCallback((field: keyof Omit<FormData, 'startDate' | 'endDate' | 'prizes' | 'prizeImages'>, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = (field: 'startDate' | 'endDate', value?: Date) => {
    if (value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  }

  const handleAddNewClick = () => {
    setEditingEventId(null);
    setFormData(defaultFormData);
    setIsFormVisible(true);
  };

  const handleEditClick = (event: Event) => {
    setEditingEventId(event.id);
    setFormData({
      ...defaultFormData,
      ...event,
      slug: event.id,
      startDate: event.startDate.toDate(),
      endDate: event.endDate.toDate(),
      registrationLink: event.registrationLink || '',
    });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingEventId(null);
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

    if (!editingEventId) {
        const docRef = doc(db, 'events', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            toast({
                variant: 'destructive',
                title: 'ID Exists',
                description: 'An event with this slug already exists. Please choose a unique slug or title.'
            });
            setIsSaving(false);
            return;
        }
    }

    const { slug: formSlug, ...restOfFormData } = formData;
    const dataToSave = {
        ...restOfFormData,
        startDate: Timestamp.fromDate(formData.startDate),
        endDate: Timestamp.fromDate(formData.endDate),
        prizes: [], // Ensure these fields are not saved for non-challenge events
        prizeImages: [],
    };

    try {
      const docRef = doc(db, 'events', slug);
      if (editingEventId) {
        await setDoc(docRef, dataToSave, { merge: true });
        toast({
          title: 'Event Updated!',
          description: 'The event has been successfully updated.',
        });
      } else {
        await setDoc(docRef, { ...dataToSave, createdAt: serverTimestamp() });
        toast({
          title: 'Event Added!',
          description: 'The new event has been created.',
        });
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not save the event to Firestore.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteDoc(doc(db, "events", eventToDelete));
      toast({
        title: "Event Deleted",
        description: "The event has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({
        variant: "destructive",
        title: "Error Deleting",
        description: "Could not delete the event.",
      });
    } finally {
        setEventToDelete(null);
    }
  };
  
  if (isFormVisible) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle>{editingEventId ? 'Edit Event' : 'Create New Event'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>
              {editingEventId ? 'Update the details for this event.' : 'Fill out the form to create a new event.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor='title'>Title</Label>
                <Input id='title' placeholder="Event Title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor='slug'>Slug (URL Identifier)</Label>
                <Input id='slug' placeholder="e.g., web-dev-workshop (optional, auto-generated from title)" value={formData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} disabled={!!editingEventId}/>
                 {!editingEventId && <p className="text-xs text-muted-foreground">This will be the unique ID. If left empty, it's created from the title. Cannot be changed later.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="A short, catchy description." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} required />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor='registrationLink'>Registration Link</Label>
                  <Input id='registrationLink' placeholder="https://forms.gle/..." value={formData.registrationLink} onChange={(e) => handleInputChange('registrationLink', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor='enrolled'>Enrolled Count</Label>
                  <Input id='enrolled' type="number" placeholder="0" value={formData.enrolled} onChange={(e) => handleInputChange('enrolled', parseInt(e.target.value, 10) || 0)} required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" placeholder="https://example.com/image.png" value={formData.imageUrl} onChange={(e) => handleInputChange('imageUrl', e.target.value)} required />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="aiHint">AI Hint (for image search)</Label>
                    <Input id="aiHint" placeholder="e.g., coding workshop" value={formData.aiHint} onChange={(e) => handleInputChange('aiHint', e.target.value)} />
                 </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v as FormData['type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Podcast">Podcast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.startDate} onSelect={(d) => handleDateChange('startDate', d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.endDate} onSelect={(d) => handleDateChange('endDate', d)} initialFocus />
                      </PopoverContent>
                    </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch id="isEnabled" checked={formData.isEnabled} onCheckedChange={(checked) => handleInputChange('isEnabled', checked)} />
                <Label htmlFor="isEnabled">Enable this event</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {isSaving ? 'Saving...' : (editingEventId ? 'Save Changes' : 'Create Event')}
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
    <>
    <div className="container mx-auto py-8">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <Button onClick={handleAddNewClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Events</CardTitle>
          <CardDescription>
            Manage workshops, podcasts, and other non-arena events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
               <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map(event => (
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
                        <Button variant="destructive" size="sm" onClick={() => setEventToDelete(event.id)}>
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
                No events found. Click "Add New Event" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
