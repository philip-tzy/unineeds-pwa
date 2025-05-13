import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Settings, LogOut, Mail, Phone, MapPin, Store, Coffee, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
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

interface ProfileData {
  avatar_url: string | null;
  contact_info?: {
    phone: string;
    address: string;
    whatsapp?: string;
    email?: string;
  };
  business_info?: {
    name: string;
    description: string;
    operatingHours?: string;
  };
}

const SellerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar_url: null
  });
  
  useEffect(() => {
    console.log("SellerProfile component mounted");
    console.log("User info:", user);
    console.log("User role:", user?.role);
    
    if (user) {
      // Check if the user is actually a seller, if not redirect to appropriate profile
      if (user.role !== 'seller') {
        console.error(`User with non-seller role (${user.role}) accessed seller profile, redirecting to general profile`);
        navigate('/profile');
        return;
      }
      
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
            const newData = payload.new;
            setProfileData({
              avatar_url: newData.avatar_url,
              contact_info: newData.contact_info,
              business_info: newData.business_info
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
          contact_info: data.contact_info,
          business_info: data.business_info
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
    navigate('/edit-profile');
  };

  // Get seller stats
  const stats = [
    { label: 'Products', value: 12, icon: <Store size={18} className="text-blue-500" /> },
    { label: 'Orders', value: 86, icon: <Package size={18} className="text-green-500" /> },
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
        <h1 className="text-white text-center font-semibold text-lg">Seller Profile</h1>
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
            <h2 className="mt-3 font-semibold text-lg">{user?.full_name || user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">Seller</p>
            <div className="mt-1 bg-blue-50 text-[#003160] text-xs px-2 py-1 rounded-full">
              Seller (UniShop & UniFood)
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
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3 flex items-center">
            <Store size={18} className="text-[#003160] mr-2" />
            Business Info
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Store className="text-[#003160] mr-2" size={16} />
                <span className="text-sm font-medium">UniShop</span>
              </div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Coffee className="text-[#003160] mr-2" size={16} />
                <span className="text-sm font-medium">UniFood</span>
              </div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
          
          {profileData.business_info && (
            <div className="mt-4 space-y-3">
              {profileData.business_info.name && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Business Name</h4>
                  <p className="text-sm text-gray-600">{profileData.business_info.name}</p>
                </div>
              )}
              
              {profileData.business_info.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{profileData.business_info.description}</p>
                </div>
              )}
              
              {profileData.business_info.operatingHours && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Operating Hours</h4>
                  <p className="text-sm text-gray-600">{profileData.business_info.operatingHours}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
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
      
      {/* Always render the seller bottom navigation */}
      <SellerBottomNavigation />
    </div>
  );
};

export default SellerProfile; 