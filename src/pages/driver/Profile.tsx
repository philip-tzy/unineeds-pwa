import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Settings, LogOut, Mail, Phone, MapPin, Car, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import type { DriverType } from '@/context/AuthContext';

interface ProfileData {
  avatar_url: string | null;
  contact_info?: {
    phone: string;
    address: string;
    whatsapp?: string;
    email?: string;
  };
  vehicle_info?: {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
  };
  role?: string;
  driver_type?: DriverType;
}

interface UserExtended {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    driver_type?: DriverType;
  }
}

const DriverProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar_url: null
  });
  
  useEffect(() => {
    console.log("DriverProfile component mounted");
    console.log("User info:", user);
    
    if (user) {
      // We know the user should be a driver based on the route protection
      fetchUserData();
      
      // Set up realtime listener for profile updates
      const profileSubscription = supabase
        .channel('profile_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            setProfileData({
              avatar_url: newData.avatar_url,
              contact_info: newData.contact_info,
              vehicle_info: newData.vehicle_info,
              role: newData.role,
              driver_type: newData.driver_type
            });
          }
        })
        .subscribe();
      
      // Clean up subscription when component unmounts
      return () => {
        profileSubscription.unsubscribe();
      };
    }
  }, [user]);
  
  const fetchUserData = async () => {
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
        setProfileData({
          avatar_url: data.avatar_url,
          contact_info: data.contact_info as any,
          vehicle_info: data.vehicle_info as any,
          role: data.role,
          driver_type: data.driver_type
        });
        console.log('User data:', data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };
  
  const handleEditProfile = () => {
    navigate('/edit-driver-profile');
  };

  // Driver type display - handle user or profileData having the driver_type
  const driverTypeDisplay = 
    (user?.user_metadata?.driver_type === 'unimove' || profileData.driver_type === 'unimove') 
      ? 'UniMove Driver' 
      : 'UniSend Driver';

  // Get driver stats
  const stats = [
    { 
      label: profileData.driver_type === 'unisend' ? 'Deliveries' : 'Rides', 
      value: '32', 
      icon: <Award size={18} className="text-blue-500" /> 
    },
    { 
      label: 'Rating', 
      value: '4.8', 
      icon: <BarChart3 size={18} className="text-green-500" /> 
    },
  ];
  
  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-[#003160] pb-12 pt-6 px-4 relative">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-full bg-white/20 text-white absolute left-4 top-6"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white text-center font-semibold text-lg">Driver Profile</h1>
      </div>
      
      <div className="px-4 -mt-10 space-y-4 pb-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center relative">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="sm" onClick={handleEditProfile}>
              <Settings size={18} />
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-1 rounded-full w-24 h-24 flex items-center justify-center overflow-hidden">
              {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle size={60} className="text-gray-500" />
              )}
            </div>
            <h2 className="mt-3 font-semibold text-lg">{user?.email?.split('@')[0]}</h2>
            <p className="text-sm text-gray-500 capitalize">Driver</p>
            <div className="mt-1 bg-blue-50 text-[#003160] text-xs px-2 py-1 rounded-full">
              {driverTypeDisplay}
            </div>
          </div>
          
          <div className="mt-4 space-y-2 text-left">
            <div className="flex items-center">
              <Mail size={16} className="text-gray-500 mr-2" />
              <p className="text-sm">{user?.email}</p>
            </div>
            
            {profileData.contact_info && (
              <>
                {profileData.contact_info.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-500 mr-2" />
                    <p className="text-sm">{profileData.contact_info.phone}</p>
                  </div>
                )}
                
                {profileData.contact_info.address && (
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-500 mr-2" />
                    <p className="text-sm">{profileData.contact_info.address}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {profileData.vehicle_info && Object.values(profileData.vehicle_info).some(value => value) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Car size={18} className="text-[#003160] mr-2" />
              Vehicle Information
            </h3>
            <div className="space-y-2">
              {profileData.vehicle_info.make && profileData.vehicle_info.model && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="text-sm font-medium">
                    {`${profileData.vehicle_info.make} ${profileData.vehicle_info.model}${profileData.vehicle_info.year ? ` (${profileData.vehicle_info.year})` : ''}`}
                  </p>
                </div>
              )}
              
              {profileData.vehicle_info.color && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="text-sm font-medium">{profileData.vehicle_info.color}</p>
                </div>
              )}
              
              {profileData.vehicle_info.licensePlate && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">License Plate</p>
                  <p className="text-sm font-medium">{profileData.vehicle_info.licensePlate}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                <div className="bg-white p-2 rounded-full mr-3">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3">Driver Options</h3>
          <Button
            onClick={() => navigate('/driver-role-selection')}
            variant="outline"
            className="w-full justify-between"
          >
            <span>Change driver type</span>
            <span className="text-[#003160]">
              {profileData.driver_type === 'unimove' ? 'UniMove' : profileData.driver_type === 'unisend' ? 'UniSend' : 'Not set'}
            </span>
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverProfilePage; 