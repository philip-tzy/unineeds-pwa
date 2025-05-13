import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Car, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { reloadSchemaCache } from '@/integrations/supabase/reloadSchemaCache';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
}

interface ContactInfo {
  phone: string;
  address: string;
}

const EditDriverProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: ''
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    address: ''
  });

  useEffect(() => {
    // Try to reload the schema cache when the component mounts
    reloadSchemaCache().catch(err => 
      console.error('Failed to reload schema cache:', err)
    );
    
    if (user) {
      setFullName(user.full_name || user.name || '');
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setAvatarUrl(data.avatar_url);
        
        if (data.contact_info) {
          setContactInfo(data.contact_info);
        }
        
        if (data.vehicle_info) {
          setVehicleInfo(data.vehicle_info);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    try {
      console.log('Updating profile with data:', {
        fullName,
        vehicleInfo,
        contactInfo,
        avatarUrl
      });
      
      // First try using the upsert_profile function
      const { data, error } = await supabase.rpc('upsert_profile', {
        profile_id: user?.id,
        user_full_name: fullName,
        user_avatar_url: avatarUrl,
        user_contact_info: contactInfo,
        user_vehicle_info: vehicleInfo
      });

      if (error) {
        console.error('Detailed error:', error);
        
        // Try using update_driver_profile function as fallback
        if (error.code === 'PGRST204') {
          console.log('Trying to reload schema cache...');
          await reloadSchemaCache();
          
          console.log('Trying fallback method with update_driver_profile...');
          const { data: rpcData, error: rpcError } = await supabase.rpc('update_driver_profile', {
            p_id: user?.id,
            p_full_name: fullName,
            p_avatar_url: avatarUrl,
            p_vehicle_info: vehicleInfo,
            p_contact_info: contactInfo
          });
          
          if (rpcError) {
            console.error('RPC fallback error:', rpcError);
            
            // Final fallback - try direct SQL
            console.log('Trying final fallback with direct update...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: fullName,
                avatar_url: avatarUrl,
                // Store as stringified JSON as direct fallback
                vehicle_info: JSON.stringify(vehicleInfo),
                contact_info: JSON.stringify(contactInfo),
                updated_at: new Date().toISOString()
              })
              .eq('id', user?.id);
            
            if (updateError) {
              throw updateError;
            }
            
            console.log('Update success via direct update');
          } else {
            console.log('Update success via RPC fallback:', rpcData);
          }
        } else {
          throw error;
        }
      } else {
        console.log('Update success via upsert_profile:', data);
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Navigate back to the profile page after successfully updating
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show detailed error information
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again or contact support with error: " + 
          (error.message || 'Unknown error'),
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
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVehicleInfoChange = (key: keyof VehicleInfo, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleContactInfoChange = (key: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-[#003160] pb-12 pt-6 px-4 relative">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/20 text-white absolute left-4 top-6"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-center font-semibold text-lg">Edit Driver Profile</h1>
      </div>

      <div className="px-4 -mt-10 space-y-4 pb-4">
        {/* Terminal Server warning */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Terminal Server Notice</AlertTitle>
          <AlertDescription className="text-yellow-700">
            If you're using this app on a Terminal Server and can't save changes, please run the
            "fix_terminal_server_permissions.bat" script as administrator, then restart the server.
          </AlertDescription>
        </Alert>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={40} className="text-gray-400" />
                    </div>
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-[#003160] p-1.5 rounded-full cursor-pointer"
                  >
                    <Upload size={16} className="text-white" />
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
                <div className="w-full mb-4">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vehicle" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Car size={18} className="text-[#003160]" />
                <h3 className="font-medium">Vehicle Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={vehicleInfo.make}
                    onChange={(e) => handleVehicleInfoChange('make', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={vehicleInfo.model}
                    onChange={(e) => handleVehicleInfoChange('model', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={vehicleInfo.year}
                    onChange={(e) => handleVehicleInfoChange('year', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={vehicleInfo.color}
                    onChange={(e) => handleVehicleInfoChange('color', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={vehicleInfo.licensePlate}
                  onChange={(e) => handleVehicleInfoChange('licensePlate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={contactInfo.phone}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => handleContactInfoChange('address', e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={updateProfile} 
            className="w-full mt-6 bg-[#003160] hover:bg-[#002040]"
          >
            Save Changes
          </Button>
        </div>
      </div>
      <DriverBottomNavigation driverType={user?.driver_type} />
    </div>
  );
};

export default EditDriverProfile; 