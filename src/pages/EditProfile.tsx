import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, User, Briefcase, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';

interface ContactInfo {
  phone: string;
  address: string;
  whatsapp?: string;
  email?: string; // This might be redundant with user.email but included for completeness
}

interface ProfileBio {
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    address: '',
    whatsapp: '',
    email: ''
  });
  const [bio, setBio] = useState<ProfileBio>({
    summary: '',
    skills: [],
    experience: '',
    education: ''
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      if (user.email) {
        setContactInfo(prev => ({ ...prev, email: user.email }));
      }
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user ID:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      console.log('Profile data retrieved:', data);
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        
        // Handle contact_info which might be a string or an object
        if (data.contact_info) {
          let contactInfoData = data.contact_info;
          
          // If it's a string, try to parse it
          if (typeof data.contact_info === 'string') {
            try {
              contactInfoData = JSON.parse(data.contact_info);
            } catch (e) {
              console.error('Error parsing contact_info:', e);
            }
          }
          
          // Extract freelancer bio data from contact_info if present
          if (user?.role === 'freelancer') {
            const bioData = {
              summary: contactInfoData.professional_summary || '',
              skills: contactInfoData.skills || [],
              experience: contactInfoData.experience || '',
              education: contactInfoData.education || ''
            };
            
            console.log('Extracted bio data from contact_info:', bioData);
            setBio(bioData);
            
            // Remove bio fields from contact_info to avoid duplication
            const { professional_summary, skills, experience, education, ...restContactInfo } = contactInfoData;
            contactInfoData = restContactInfo;
          }
          
          setContactInfo(prev => ({
            ...prev,
            ...contactInfoData
          }));
        }
        
        // Handle bio data if it exists directly (backward compatibility)
        if (data.bio) {
          let bioData = data.bio;
          
          // If it's a string, try to parse it
          if (typeof data.bio === 'string') {
            try {
              bioData = JSON.parse(data.bio);
            } catch (e) {
              console.error('Error parsing bio:', e);
              // If we can't parse, use as a string in summary
              bioData = { summary: data.bio };
            }
          }
          
          setBio(prev => ({
            ...prev,
            ...bioData
          }));
        }
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
    }
  };

  const updateProfile = async () => {
    try {
      console.log('Updating profile with data:', {
        fullName,
        contactInfo,
        avatarUrl: avatarUrl ? 'Base64 data available' : null
      });
      
      // Create a simple update object with only the essential fields
      // to avoid issues with missing columns
      const updateData: any = {
        full_name: fullName,
        updated_at: new Date().toISOString()
      };
      
      // Only include avatar_url if it exists
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      
      // Only include contact_info if it's not empty
      if (Object.keys(contactInfo).some(key => contactInfo[key as keyof ContactInfo])) {
        updateData.contact_info = contactInfo;
      }
      
      // For freelancers, try to save bio info in the contact_info field as a workaround
      if (user?.role === 'freelancer' && bio) {
        // Make sure contact_info exists
        if (!updateData.contact_info) {
          updateData.contact_info = {};
        }
        
        // Add bio data to contact_info
        updateData.contact_info.professional_summary = bio.summary;
        updateData.contact_info.skills = bio.skills;
        updateData.contact_info.experience = bio.experience;
        updateData.contact_info.education = bio.education;
        
        console.log('Saved freelancer bio info in contact_info');
      }
      
      console.log('Sending update with fields:', Object.keys(updateData));
      
      // Try the update with the simplified data
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully');
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Navigate back to the profile page after successfully updating
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      toast({
        title: "Error",
        description: "Failed to update profile: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      
      console.log('Attempting to upload file:', fileName);
      
      // Convert the file to a base64 string to use in updateProfile
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader async operation
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            // Get only the base64 data part without the mime type prefix
            const base64String = e.target.result.toString();
            resolve(base64String);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(reader.error);
      });
      
      reader.readAsDataURL(file);
      
      // Get the base64 data
      const base64Data = await base64Promise;
      
      console.log('File converted to base64, length:', base64Data.length);
      
      // Store the base64 data in state to use when updating the profile
      setAvatarUrl(base64Data);
      
      toast({
        title: "Success",
        description: "Image ready for upload. Click Save Changes to update your profile picture.",
      });
    } catch (error) {
      console.error('Error processing avatar:', error);
      toast({
        title: "Error",
        description: "Failed to process image: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleContactInfoChange = (key: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleBioChange = (key: keyof ProfileBio, value: string) => {
    if (key === 'skills') return; // Skills are handled separately
    setBio(prev => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    if (skillInput && skillInput.trim() !== '') {
      // Make sure we have a valid skills array
      const currentSkills = Array.isArray(bio.skills) ? bio.skills : [];
      
      if (!currentSkills.includes(skillInput)) {
        setBio(prev => ({
          ...prev,
          skills: [...currentSkills, skillInput]
        }));
        console.log('Skill added:', skillInput);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    // Make sure we have a valid skills array
    const currentSkills = Array.isArray(bio.skills) ? bio.skills : [];
    
    setBio(prev => ({
      ...prev,
      skills: currentSkills.filter(s => s !== skill)
    }));
    console.log('Skill removed:', skill);
  };

  // Determine which bottom navigation to show based on user role
  const renderBottomNavigation = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'freelancer':
        return <FreelancerBottomNavigation />;
      case 'seller':
        return user.seller_type ? 
          <SellerBottomNavigation sellerType={user.seller_type} /> : 
          <BottomNavigation />;
      default:
        return <BottomNavigation />;
    }
  };

  // Get background color based on user role
  const getHeaderBgColor = () => {
    if (user?.role === 'seller' || user?.role === 'freelancer') {
      return 'bg-[#003160]';
    } else if (user?.role === 'driver') {
      return 'bg-[#003160]';
    } else {
      return 'bg-[#003160]';
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className={`${getHeaderBgColor()} pb-12 pt-6 px-4 relative`}>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/20 text-white absolute left-4 top-6"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-center font-semibold text-lg">Edit Profile</h1>
      </div>

      <div className="px-4 -mt-10 space-y-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              {user?.role === 'freelancer' && (
                <TabsTrigger value="bio" className="col-span-2 mt-2">Professional Bio</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4 pt-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <User size={40} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-white cursor-pointer shadow-md"
                  >
                    <Upload size={16} />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>
              
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email || ''}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                  placeholder="Your email address"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                  placeholder="Your phone number"
                  className="mt-1"
                />
              </div>
              
              {user?.role === 'freelancer' && (
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (for clients to contact you)</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={contactInfo.whatsapp || ''}
                    onChange={(e) => handleContactInfoChange('whatsapp', e.target.value)}
                    placeholder="Your WhatsApp number"
                    className="mt-1"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => handleContactInfoChange('address', e.target.value)}
                  placeholder="Your address"
                  className="mt-1"
                />
              </div>
            </TabsContent>
            
            {user?.role === 'freelancer' && (
              <TabsContent value="bio" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={bio.summary || ''}
                    onChange={(e) => handleBioChange('summary', e.target.value)}
                    placeholder="Brief description of your professional background"
                    className="mt-1"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="skills"
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSkill}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bio.skills?.map((skill, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <span className="text-sm">{skill}</span>
                        <button 
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="experience">Work Experience</Label>
                  <Textarea
                    id="experience"
                    value={bio.experience || ''}
                    onChange={(e) => handleBioChange('experience', e.target.value)}
                    placeholder="Brief overview of your work experience"
                    className="mt-1"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={bio.education || ''}
                    onChange={(e) => handleBioChange('education', e.target.value)}
                    placeholder="Your educational background"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button 
              onClick={updateProfile}
              className={user?.role === 'freelancer' ? 'bg-[#003160] hover:bg-[#002040] text-white' : ''}
              disabled={uploading}
            >
              {uploading ? (
                <span>Processing...</span>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {renderBottomNavigation()}
    </div>
  );
};

export default EditProfile; 