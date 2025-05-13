import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertCircle, X, Upload, CheckCircle2 } from 'lucide-react';

interface FreelancerProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  hourly_rate: number | null;
  contact_info: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
  } | null;
  portfolio_url: string | null;
}

export function ProfileEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfile(data as FreelancerProfile);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
      toast({
        title: 'Error loading profile',
        description: err.message || 'Could not load your profile information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contact_info.')) {
      const contactField = name.split('.')[1];
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          contact_info: {
            ...prev.contact_info,
            [contactField]: value
          }
        };
      });
    } else {
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: value
        };
      });
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsList = e.target.value.split(',').map(skill => skill.trim());
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        skills: skillsList
      };
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }
      
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user?.id) return null;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const fileName = `${Date.now()}_${avatarFile.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the avatar
      const { data, error } = await supabase.storage
        .from('profile_photos')
        .upload(filePath, avatarFile, {
          upsert: true,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Could not upload profile photo',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Upload avatar if new one is selected
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }
      
      // Update profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          avatar_url: avatarUrl,
          bio: profile.bio,
          skills: profile.skills,
          hourly_rate: profile.hourly_rate,
          contact_info: profile.contact_info,
          portfolio_url: profile.portfolio_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been successfully updated',
        variant: 'default'
      });
      
      // Refresh profile
      fetchProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      toast({
        title: 'Update failed',
        description: err.message || 'Could not update your profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not load your profile information. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Edit Freelancer Profile</CardTitle>
          <CardDescription>
            Complete your profile to attract more clients and showcase your skills
          </CardDescription>
        </CardHeader>
        
        {error && (
          <div className="px-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url || undefined} 
                    alt={profile.name} 
                  />
                  <AvatarFallback>{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                    {uploadProgress}%
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="mb-2 text-sm font-medium">Profile Photo</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id="avatar"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {avatarFile ? avatarFile.name : 'Select Image'}
                  </Button>
                  
                  {avatarFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAvatarFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a professional photo (max 2MB)
                </p>
              </div>
            </div>
            
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="font-medium">Basic Information</div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="hourly_rate" className="text-sm font-medium">
                    Hourly Rate (IDR)
                  </label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    value={profile.hourly_rate || ''}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a short bio describing your skills and experience..."
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="skills" className="text-sm font-medium">
                  Skills (comma separated)
                </label>
                <Input
                  id="skills"
                  name="skills"
                  value={profile.skills?.join(', ') || ''}
                  onChange={handleSkillsChange}
                  placeholder="e.g., Graphic Design, Web Development, Writing"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="portfolio_url" className="text-sm font-medium">
                  Portfolio URL
                </label>
                <Input
                  id="portfolio_url"
                  name="portfolio_url"
                  type="url"
                  value={profile.portfolio_url || ''}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="font-medium">Contact Information</div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="contact_info.phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="contact_info.phone"
                    name="contact_info.phone"
                    value={profile.contact_info?.phone || ''}
                    onChange={handleChange}
                    placeholder="+62812345678"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact_info.whatsapp" className="text-sm font-medium">
                    WhatsApp
                  </label>
                  <Input
                    id="contact_info.whatsapp"
                    name="contact_info.whatsapp"
                    value={profile.contact_info?.whatsapp || ''}
                    onChange={handleChange}
                    placeholder="+62812345678"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact_info.email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="contact_info.email"
                    name="contact_info.email"
                    type="email"
                    value={profile.contact_info?.email || ''}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contact_info.address" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    id="contact_info.address"
                    name="contact_info.address"
                    value={profile.contact_info?.address || ''}
                    onChange={handleChange}
                    placeholder="Your address"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={fetchProfile}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 