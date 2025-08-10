
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type AdvertisementData = {
  title: string;
  description: string;
  imageUrl: string;
  buttonLink: string;
  buttonText: string;
  isEnabled: boolean;
};

const defaultAdData: AdvertisementData = {
  title: 'WHAT GOOGLE LOOKS FOR IN FUTURE ENGINEERS',
  description: 'Podcast with Leader Building Teams at Google',
  imageUrl: 'https://placehold.co/600x400',
  buttonLink: '#',
  buttonText: 'Register Now',
  isEnabled: true,
};

// NOTE: This page manages a single, specific ad document.
// For multiple ads, a more complex list/edit/create system would be needed.
export default function ManageAdvertisementPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AdvertisementData>(defaultAdData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const db = getFirestore(app);
  // We'll use a known ID for simplicity, but a real app might have a list of ads.
  const adDocRef = doc(db, 'advertisements', 'main_dashboard_promo');

  useEffect(() => {
    const fetchAdvertisement = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(adDocRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as AdvertisementData);
        } else {
          await setDoc(adDocRef, { ...defaultAdData, createdAt: serverTimestamp() });
          setFormData(defaultAdData);
          toast({
            title: 'Advertisement Initialized',
            description: 'Default advertisement data has been set.',
          });
        }
      } catch (error) {
        console.error("Error fetching advertisement:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load advertisement data from Firestore.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdvertisement();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof AdvertisementData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(adDocRef, { ...formData, createdAt: serverTimestamp() }, { merge: true });
      toast({
        title: 'Advertisement Updated!',
        description: 'The dashboard banner has been successfully updated.',
      });
    } catch (error) {
      console.error("Error saving advertisement:", error);
      toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not save the advertisement to Firestore.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-4">Loading Advertisement Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Dashboard Advertisement</CardTitle>
          <CardDescription>
            Update the promotional banner carousel on the user dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                placeholder="Advertisement Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A short, catchy description."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.png"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                required
              />
            </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    placeholder="e.g., Register Now"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    required
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="buttonLink">Button Link</Label>
                  <Input
                    id="buttonLink"
                    placeholder="https://example.com/register"
                    value={formData.buttonLink}
                    onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                    required
                  />
                </div>
             </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isEnabled" 
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => handleInputChange('isEnabled', checked)}
                />
                <Label htmlFor="isEnabled">Enable this advertisement on the dashboard</Label>
              </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
