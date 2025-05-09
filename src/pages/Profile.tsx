import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Settings, LogOut, Mail, Phone, MapPin, Award, BarChart3 } from 'lucide-react';
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

const getRoleSpecificStats = (role: string, sellerType?: string | null) => {
  switch (role) {
    case 'driver':
      return [
        { label: 'Completed Trips', value: 48, icon: <Award size={18} className="text-blue-500" /> },
        { label: 'Rating', value: '4.8', icon: <BarChart3 size={18} className="text-green-500" /> },
      ];
    case 'seller':
      if (sellerType === 'unishop') {
        return [
          { label: 'Products', value: 12, icon: <Award size={18} className="text-blue-500" /> },
          { label: 'Orders', value: 86, icon: <BarChart3 size={18} className="text-green-500" /> },
        ];
      } else { // unifood
        return [
          { label: 'Menu Items', value: 8, icon: <Award size={18} className="text-blue-500" /> },
          { label: 'Orders', value: 124, icon: <BarChart3 size={18} className="text-green-500" /> },
        ];
      }
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
  
  const stats = getRoleSpecificStats(user?.role || 'customer', user?.sellerType);
  
  const renderBottomNavigation = () => {
    switch (user?.role) {
      case 'driver':
        return <DriverBottomNavigation />;
      case 'seller':
        return user?.sellerType ? <SellerBottomNavigation sellerType={user.sellerType} /> : null;
      case 'freelancer':
        return <FreelancerBottomNavigation />;
      default:
        return <BottomNavigation />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Profile</h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Settings size={24} />
        </button>
      </div>
      
      {/* Content */}
      <main className="container p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center">
            <div className="mr-4">
              <UserCircle size={64} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
              <p className="text-gray-500">
                {user?.role.charAt(0).toUpperCase() + user?.role.slice(1) || 'Customer'}
                {user?.role === 'seller' && user?.sellerType && ` (${user.sellerType === 'unishop' ? 'UniShop' : 'UniFood'})`}
              </p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-gray-600">
              <Mail size={16} className="mr-2" />
              <span>{user?.email || 'No email added'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone size={16} className="mr-2" />
              <span>Not added</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-2" />
              <span>Not added</span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
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
        
        {/* Role Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3">Account Type</h3>
          <Button
            onClick={() => navigate('/role-selection')}
            variant="outline"
            className="w-full justify-between"
          >
            <span>Switch role</span>
            <span className="text-[#9b87f5]">
              {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
            </span>
          </Button>
          
          {user?.role === 'seller' && (
            <Button
              onClick={() => navigate('/seller-role-selection')}
              variant="outline"
              className="w-full justify-between mt-3"
            >
              <span>Change seller type</span>
              <span className="text-[#9b87f5]">
                {user.sellerType === 'unishop' ? 'UniShop' : user.sellerType === 'unifood' ? 'UniFood' : 'Not set'}
              </span>
            </Button>
          )}
        </div>
        
        {/* Logout Section */}
        <div className="container p-4 mb-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">Account Actions</h3>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="w-full py-6 text-base font-medium"
              >
                <LogOut size={18} className="mr-2" />
                Log Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to login again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                  Yes, Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="text-center mt-4 text-xs text-gray-500">
            <p>Logged in as {user?.email}</p>
            <p>Role: {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</p>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      {renderBottomNavigation()}
    </div>
  );
};

export default Profile;
