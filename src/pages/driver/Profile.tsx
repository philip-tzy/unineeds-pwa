import React, { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Edit2, LogOut, Mail, MapPin, Phone, Shield, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  profile_image?: string;
  rating: number;
  total_trips: number;
  vehicle_type: string;
  license_plate: string;
  account_status: string;
}

const DriverProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        // In a real implementation, fetch from Supabase
        // For now, using mock data
        setTimeout(() => {
          const mockProfile: DriverProfile = {
            id: user.id,
            full_name: 'Alex Rodriguez',
            email: user.email || 'alex.rodriguez@example.com',
            phone: '+1 234-567-8901',
            address: '123 Main St, City, Country',
            profile_image: 'https://randomuser.me/api/portraits/men/32.jpg',
            rating: 4.8,
            total_trips: 357,
            vehicle_type: 'Motorcycle',
            license_plate: 'ABC 123',
            account_status: 'active'
          };

          setProfile(mockProfile);
          setLoading(false);
        }, 800);

        // In a real implementation, you would fetch from Supabase like this:
        /*
        const { data, error } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProfile(data as DriverProfile);
        }
        */
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, toast]);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">
          <span className="text-[#003160]">Profile</span>
        </h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Edit2 size={20} />
        </button>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-10">
            <p>Loading profile...</p>
          </div>
        ) : profile ? (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto bg-gray-200">
                  {profile.profile_image ? (
                    <img 
                      src={profile.profile_image} 
                      alt={profile.full_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="w-full h-full p-4 text-gray-400" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-[#003160] text-white p-1.5 rounded-full">
                  <Camera size={16} />
                </button>
              </div>
              
              <h2 className="text-xl font-semibold mt-4">{profile.full_name}</h2>
              
              <div className="flex items-center justify-center mt-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="ml-1 text-gray-800">{profile.rating}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-600">{profile.total_trips} trips</span>
              </div>
              
              <div className="mt-4 flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 border-[#003160] text-[#003160]"
                >
                  <Edit2 size={14} />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 border-red-500 text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Logout
                </Button>
              </div>
            </div>
            
            {/* Contact Information */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="text-md font-medium mb-3">Contact Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail size={16} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone size={16} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm">{profile.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin size={16} className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm">{profile.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Vehicle Information */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="text-md font-medium mb-3">Vehicle Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Vehicle Type</p>
                    <p className="text-sm font-medium">{profile.vehicle_type}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">License Plate</p>
                    <p className="text-sm font-medium">{profile.license_plate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Status */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield size={18} className="text-green-500 mr-2" />
                  <div className="flex-1">
                    <h3 className="text-md font-medium">Account Status</h3>
                    <p className="text-sm text-gray-500">Your account is {profile.account_status}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${profile.account_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </CardContent>
            </Card>
            
            {/* App Settings Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/settings')}
            >
              App Settings
            </Button>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Failed to load profile information</p>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverProfilePage; 