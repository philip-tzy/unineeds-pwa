import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Settings, LogOut, Mail, Phone, MapPin, Award, BarChart3, Car, Briefcase, Store, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import BottomNavigation from '@/components/BottomNavigation';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
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
import DriverRoleSelection from "./pages/DriverRoleSelection";
import RoleSelection from "./pages/RoleSelection";
import { supabase } from '@/integrations/supabase/client';
import { 
  getFreelancerMetrics, 
  subscribeToFreelancerMetrics,
  FreelancerMetrics
} from '@/services/freelancerMetrics';

interface ProfileData {
  avatar_url: string | null;
  contact_info?: {
    phone: string;
    address: string;
    whatsapp?: string;
    email?: string;
    professional_summary?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
  vehicle_info?: {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
  };
}

const getRoleSpecificStats = (role: string, sellerType?: string | null, driverType?: string | null) => {
  switch (role) {
    case 'driver':
      let driverStatsLabel = 'Completed Trips';
      if (driverType === 'unisend') {
        driverStatsLabel = 'Completed Deliveries';
      } else if (driverType === 'unimove') {
        driverStatsLabel = 'Completed Rides';
      }
      return [
        { label: driverStatsLabel, value: '-', icon: <Award size={18} className="text-blue-500" /> },
        { label: 'Rating', value: '-', icon: <BarChart3 size={18} className="text-green-500" /> },
      ];
    case 'seller':
      return [
        { label: 'Products', value: 12, icon: <Store size={18} className="text-blue-500" /> },
        { label: 'Orders', value: 86, icon: <Package size={18} className="text-green-500" /> },
      ];
    case 'freelancer':
      return [
        { label: 'Projects Completed', value: 26, icon: <Award size={18} className="text-blue-500" /> },
        { label: 'Rating', value: '4.9', icon: <BarChart3 size={18} className="text-green-500" /> },
      ];
    default: // customer
      return [
        { label: 'Orders', value: 12, icon: <Award size={18} className="text-blue-500" /> },
        { label: 'Favorites', value: 8, icon: <BarChart3 size={18} className="text-green-500" /> },
      ];
  }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar_url: null
  });
  const [freelancerMetrics, setFreelancerMetrics] = useState<FreelancerMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  
  useEffect(() => {
    console.log("Profile component mounted");
    console.log("User info:", user);
    console.log("User role:", user?.role);
    
    if (user) {
      // Redirect seller to seller profile page
      if (user.role === 'seller') {
        console.log("User is a seller, redirecting to seller profile page");
        navigate('/seller/profile');
        return;
      }
      
      // Redirect driver to driver profile page
      if (user.role === 'driver') {
        console.log("User is a driver, redirecting to driver profile page");
        console.log("User driver type:", user.driver_type);
        // Add a small delay to ensure navigation works properly
        setTimeout(() => {
          navigate('/driver/profile');
        }, 100);
        return;
      }
      
      if (user.role === 'freelancer') {
        console.log("User is a freelancer, loading freelancer metrics");
        setMetricsLoading(true);
        fetchFreelancerMetrics();
      }
      
      // Set user role for conditional rendering
      setUserRole(user.role);
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
            setUserRole(newData.role || null);
            setProfileData({
              avatar_url: newData.avatar_url,
              contact_info: newData.contact_info,
              vehicle_info: newData.vehicle_info
            });
            
            // If role changed to freelancer, fetch metrics
            if (newData.role === 'freelancer' && userRole !== 'freelancer') {
              fetchFreelancerMetrics(user.id);
            }
          }
        })
        .subscribe();
      
      // Clean up subscription when component unmounts
      return () => {
        profileSubscription.unsubscribe();
      };
    }
  }, [user, navigate]);
  
  useEffect(() => {
    // Fetch freelancer metrics when role is set to freelancer
    if (user?.id && userRole === 'freelancer') {
      fetchFreelancerMetrics(user.id);
      
      // Subscribe to real-time metrics updates
      const unsubscribe = subscribeToFreelancerMetrics(user.id, (updatedMetrics) => {
        console.log('Freelancer metrics updated:', updatedMetrics);
        setFreelancerMetrics(updatedMetrics);
        setMetricsLoading(false);
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id, userRole]);
  
  const fetchFreelancerMetrics = async (userId: string) => {
    setMetricsLoading(true);
    try {
      const metrics = await getFreelancerMetrics(userId);
      if (metrics) {
        setFreelancerMetrics(metrics);
      }
    } catch (error) {
      console.error('Error fetching freelancer metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };
  
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
        setUserRole(data.role || null);
        setProfileData({
          avatar_url: data.avatar_url,
          contact_info: data.contact_info,
          vehicle_info: data.vehicle_info
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
  
  // Get role-specific stats with real metrics
  const stats = useMemo(() => {
    if (userRole === 'freelancer' && freelancerMetrics) {
      return [
        { 
          label: 'Projects Completed', 
          value: metricsLoading ? '...' : freelancerMetrics.completed_jobs.toString(), 
          icon: <Award size={18} className="text-blue-500" /> 
        },
        { 
          label: 'Rating', 
          value: metricsLoading ? 
            '...' : 
            (freelancerMetrics.total_reviews > 0 ? 
              freelancerMetrics.average_rating.toFixed(1) : 
              '-'), 
          icon: <BarChart3 size={18} className="text-green-500" /> 
        },
      ];
    } else {
      // Use the original function for other roles
      return getRoleSpecificStats(userRole || 'customer', user?.seller_type, user?.driver_type);
    }
  }, [userRole, user?.seller_type, user?.driver_type, freelancerMetrics, metricsLoading]);
  
  const handleEditProfile = () => {
    if (userRole === 'driver') {
      navigate('/edit-driver-profile');
    } else {
      navigate('/edit-profile');
    }
  };

  // Get background color based on user role
  const getHeaderBgColor = () => {
    if (userRole === 'seller' || userRole === 'freelancer') {
      return 'bg-[#003160]';
    } else if (userRole === 'driver') {
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
        <h1 className="text-white text-center font-semibold text-lg">Profile</h1>
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
            <p className="text-sm text-gray-500 capitalize">{userRole}</p>
            {userRole === 'seller' && (
              <div className="mt-1 bg-blue-50 text-[#003160] text-xs px-2 py-1 rounded-full">
                Seller (UniShop & UniFood)
              </div>
            )}
            {userRole === 'driver' && user?.driver_type && (
              <div className="mt-1 bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full">
                {user.driver_type === 'unimove' ? 'UniMove Driver' : 'UniSend Driver'}
              </div>
            )}
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
        
        {userRole === 'freelancer' && profileData.contact_info && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Briefcase size={18} className="text-[#003160] mr-2" />
              Professional Profile
            </h3>
            
            {profileData.contact_info.professional_summary && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Professional Summary</h4>
                <p className="text-sm text-gray-600">{profileData.contact_info.professional_summary}</p>
              </div>
            )}
            
            {profileData.contact_info.skills && profileData.contact_info.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.contact_info.skills.map((skill, index) => (
                    <span key={index} className="text-xs bg-blue-50 text-[#003160] px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {profileData.contact_info.experience && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Work Experience</h4>
                <p className="text-sm text-gray-600">{profileData.contact_info.experience}</p>
              </div>
            )}
            
            {profileData.contact_info.education && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Education</h4>
                <p className="text-sm text-gray-600">{profileData.contact_info.education}</p>
              </div>
            )}
          </div>
        )}
        
        {userRole === 'seller' && (
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
          </div>
        )}
        
        {userRole === 'driver' && profileData.vehicle_info && Object.values(profileData.vehicle_info).some(value => value) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Car size={18} className={userRole === 'freelancer' || userRole === 'seller' ? "text-[#003160] mr-2" : "text-[#003160] mr-2"} />
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
        
        {userRole !== 'freelancer' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="font-semibold mb-3">Account Type</h3>
            <Button
              onClick={() => navigate('/role-selection')}
              variant="outline"
              className="w-full justify-between"
            >
              <span>Switch role</span>
              <span className={userRole === 'freelancer' || userRole === 'seller' ? "text-[#003160]" : "text-[#003160]"}>
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Not set'}
              </span>
            </Button>
            
            {userRole === 'driver' && (
              <Button
                onClick={() => navigate('/driver-role-selection')}
                variant="outline"
                className="w-full justify-between mt-3"
              >
                <span>Change driver type</span>
                <span className="text-[#003160]">
                  {user.driver_type === 'unimove' ? 'UniMove' : user.driver_type === 'unisend' ? 'UniSend' : 'Not set'}
                </span>
              </Button>
            )}
          </div>
        )}
        
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
      
      {userRole === 'driver' ? (
        <DriverBottomNavigation />
      ) : userRole === 'seller' ? (
        <SellerBottomNavigation />
      ) : userRole === 'freelancer' ? (
        <FreelancerBottomNavigation />
      ) : (
        <BottomNavigation />
      )}
    </div>
  );
};

export default Profile;
