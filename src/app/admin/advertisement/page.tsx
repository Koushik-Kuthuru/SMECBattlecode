
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

type AdvertisementData = {
  title: string;
  description: string;
  imageUrl: string;
  buttonLink: string;
};

const defaultAdData: AdvertisementData = {
  title: 'WHAT GOOGLE LOOKS FOR IN FUTURE ENGINEERS',
  description: 'Podcast with Leader Building Teams at Google',
  imageUrl: 'https://placehold.co/192x128',
  buttonLink: '#',
};

export default function ManageAdvertisementPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AdvertisementData>(defaultAdData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const db = getFirestore(app);
  const adDocRef = doc(db, 'advertisements', 'dashboard_banner');

  useEffect(() => {
    const fetchAdvertisement = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(adDocRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as AdvertisementData);
        } else {
          // If the document doesn't exist, create it with default data
          await setDoc(adDocRef, defaultAdData);
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

  const handleInputChange = (field: keyof AdvertisementData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(adDocRef, formData, { merge: true });
      toast({
        title: 'Advertisement Updated!',
        description: 'The dashboard banner has been successfully updated for all users.',
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
          <CardTitle>Manage Advertisement</CardTitle>
          <CardDescription>
            Update the promotional banner displayed on the user dashboard. Changes will be reflected in real-time.
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
