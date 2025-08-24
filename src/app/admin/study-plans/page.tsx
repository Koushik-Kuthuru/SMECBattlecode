
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2, PlusCircle, Trash2, Edit, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { StudyPlan } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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


type FormData = Omit<StudyPlan, 'id' | 'createdAt'>;

const defaultFormData: FormData = {
  title: '',
  description: '',
  iconName: 'Book',
  buttonText: 'Start Learning',
  href: '#',
  gradient: 'from-blue-500 to-sky-700',
  isEnabled: true,
};

const ICONS = ['Book', 'BrainCircuit', 'MessageSquare', 'Code2', 'Target', 'Trophy'];
const GRADIENTS = [
    { name: 'Green', value: 'from-green-600 to-emerald-800' },
    { name: 'Purple', value: 'from-purple-600 to-indigo-800' },
    { name: 'Blue', value: 'from-blue-500 to-sky-700' },
    { name: 'Orange', value: 'from-orange-500 to-amber-700' },
    { name: 'Red', value: 'from-red-500 to-rose-700' },
    { name: 'Pink', value: 'from-pink-500 to-fuchsia-700' },
];

export default function ManageStudyPlansPage() {
  const { toast } = useToast();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  
  const db = getFirestore(app);
  const plansCollectionRef = collection(db, 'study_plans');

  const fetchPlans = () => {
    const q = query(plansCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyPlan));
      setStudyPlans(plansList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching study plans:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load study plans from Firestore.'
      });
      setIsLoading(false);
    });
    return unsubscribe;
  };
  
  useEffect(() => {
    const unsubscribe = fetchPlans();
    return () => unsubscribe();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewClick = () => {
    setEditingPlanId(null);
    setFormData(defaultFormData);
    setIsFormVisible(true);
  };

  const handleEditClick = (plan: StudyPlan) => {
    setEditingPlanId(plan.id);
    setFormData({
      title: plan.title,
      description: plan.description,
      iconName: plan.iconName,
      buttonText: plan.buttonText,
      href: plan.href,
      gradient: plan.gradient,
      isEnabled: plan.isEnabled,
    });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingPlanId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingPlanId) {
        const planDocRef = doc(db, 'study_plans', editingPlanId);
        await setDoc(planDocRef, formData, { merge: true });
        toast({
          title: 'Study Plan Updated!',
          description: 'The plan has been successfully updated.',
        });
      } else {
        const dataToSave = { ...formData, createdAt: serverTimestamp() };
        await addDoc(plansCollectionRef, dataToSave);
        toast({
          title: 'Study Plan Added!',
          description: 'The new study plan has been created.',
        });
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving study plan:", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not save the study plan to Firestore.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    try {
      await deleteDoc(doc(db, "study_plans", planToDelete));
      toast({
        title: "Study Plan Deleted",
        description: "The study plan has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting study plan: ", error);
      toast({
        variant: "destructive",
        title: "Error Deleting",
        description: "Could not delete the study plan.",
      });
    } finally {
        setPlanToDelete(null);
    }
  };
  
  const handleToggleEnable = async (planId: string, isEnabled: boolean) => {
      setIsSaving(true);
      try {
          const planRef = doc(db, 'study_plans', planId);
          await updateDoc(planRef, { isEnabled: isEnabled });
          toast({
              title: 'Study Plan Updated',
              description: `Plan has been ${isEnabled ? 'enabled' : 'disabled'}.`
          });
      } catch (error) {
           console.error("Error updating plan status: ", error);
           toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update plan status.'
           });
      } finally {
        setIsSaving(false);
      }
  };
  
  if (isFormVisible) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle>{editingPlanId ? 'Edit Study Plan' : 'Create New Study Plan'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>
              {editingPlanId ? 'Update the details for this study plan.' : 'Fill out the form to create a new plan.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor='title'>Title</Label>
                <Input id='title' placeholder="Plan Title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="A short description for the plan." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} required />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="iconName">Icon</Label>
                  <Select value={formData.iconName} onValueChange={(v) => handleInputChange('iconName', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ICONS.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="gradient">Color Gradient</Label>
                  <Select value={formData.gradient} onValueChange={(v) => handleInputChange('gradient', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {GRADIENTS.map(g => <SelectItem key={g.value} value={g.value}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input id="buttonText" placeholder="e.g., Start Learning" value={formData.buttonText} onChange={(e) => handleInputChange('buttonText', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="href">Link URL</Label>
                  <Input id="href" placeholder="e.g., /challenges or https://example.com" value={formData.href} onChange={(e) => handleInputChange('href', e.target.value)} required />
                  <p className="text-xs text-muted-foreground">For internal pages, use a relative path like <code className="bg-muted px-1 rounded-sm">/about</code>. For external sites, use the full URL.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isEnabled" checked={formData.isEnabled} onCheckedChange={(checked) => handleInputChange('isEnabled', checked)} />
                <Label htmlFor="isEnabled">Enable this study plan</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {isSaving ? 'Saving...' : (editingPlanId ? 'Save Changes' : 'Create Plan')}
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
        <h1 className="text-3xl font-bold">Manage Study Plans</h1>
        <Button onClick={handleAddNewClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Study Plans</CardTitle>
          <CardDescription>
            Manage the study plan cards that appear on the Challenges page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
               <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : studyPlans.length > 0 ? (
            <div className="space-y-4">
              {studyPlans.map(plan => (
                <div key={plan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg gap-4">
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleEditClick(plan)}>
                      <div className={`w-16 h-16 rounded-md bg-gradient-to-br ${plan.gradient}`}></div>
                      <div>
                        <h3 className="font-semibold">{plan.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{plan.description}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                           <Switch
                             checked={plan.isEnabled}
                             onCheckedChange={(checked) => handleToggleEnable(plan.id, checked)}
                             disabled={isSaving}
                           />
                           <Label>{plan.isEnabled ? 'Enabled' : 'Disabled'}</Label>
                     </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(plan)}>
                             <Edit className="mr-2 h-4 w-4" />
                             Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setPlanToDelete(plan.id)}>
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
                No study plans found. Click "Add New Plan" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
     <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the study plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
