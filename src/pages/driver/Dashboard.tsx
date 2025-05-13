import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Package, 
  Navigation, 
  ToggleLeft, 
  ToggleRight,
  DollarSign,
  PieChart,
  TrendingUp,
  Calendar,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { useAuth } from '@/context/AuthContext';
import { useDriverStats } from '@/hooks/useRealtimeDriverData';
import { supabase } from '@/integrations/supabase/client';

interface RecentActivity {
  id: string;
  type: 'ride' | 'delivery';
  title: string;
  timestamp: string;
  amount: number;
  rating: number;
}

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  
  // Use our custom hook for driver stats
  const driverStats = useDriverStats(user?.id);
  
  // Setup realtime activity subscription
  React.useEffect(() => {
    if (!user?.id) return;
    
    const fetchRecentActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_activity')
          .select('*')
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          console.error('Error fetching recent activity:', error);
        } else if (data) {
          setRecentActivity(data.map(item => ({
            id: item.id,
            type: item.activity_type,
            title: item.title,
            timestamp: new Date(item.created_at).toLocaleString(),
            amount: item.amount || 0,
            rating: item.rating || 0
          })));
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };
    
    fetchRecentActivity();
    
    const activitySubscription = supabase
      .channel('driver_activity_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_activity',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        console.log('New activity:', payload);
        if (payload.new) {
          const newActivity = payload.new;
          setRecentActivity(prev => [{
            id: newActivity.id,
            type: newActivity.activity_type,
            title: newActivity.title,
            timestamp: new Date(newActivity.created_at).toLocaleString(),
            amount: newActivity.amount || 0,
            rating: newActivity.rating || 0
          }, ...prev.slice(0, 4)]);
        }
      })
      .subscribe();
    
    return () => {
      activitySubscription.unsubscribe();
    };
  }, [user?.id]);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar */}
      <div className="bg-[#003160] p-4 text-white shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              <span className="text-white">Uni</span>
              <span className="text-gray-300">Needs</span>
            </h1>
            <p className="text-sm text-gray-300">Driver Dashboard</p>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center ${isOnline ? 'text-green-400' : 'text-gray-300'}`}
            >
              {isOnline ? (
                <>
                  <span className="mr-2">Online</span>
                  <ToggleRight size={24} />
                </>
              ) : (
                <>
                  <span className="mr-2">Offline</span>
                  <ToggleLeft size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Driver Status */}
      <div className="px-4 py-6 bg-[#003160] text-white">
        <div className="mb-4">
          <p className="text-gray-300 text-sm">Welcome back</p>
          <h2 className="text-xl font-bold">{user?.full_name || user?.name || 'Driver'}</h2>
        </div>
        
        <div className="bg-white text-gray-800 rounded-lg p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <DollarSign size={24} className="text-[#003160] mb-1" />
              <span className="text-xs text-gray-500">Today's Earnings</span>
              <span className="font-bold">${driverStats.earnings}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Star size={24} className="text-[#B10000] mb-1" />
              <span className="text-xs text-gray-500">Rating</span>
              <span className="font-bold">{driverStats.rating || '-'}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Bike size={24} className="text-[#003160] mb-1" />
              <span className="text-xs text-gray-500">Rides</span>
              <span className="font-bold">{driverStats.completedRides}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Package size={24} className="text-[#003160] mb-1" />
              <span className="text-xs text-gray-500">Deliveries</span>
              <span className="font-bold">{driverStats.completedDeliveries}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Selection */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Select Service</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/driver/unimove')}
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-[#003160]"
          >
            <Bike size={28} className="text-[#003160]" />
            <span>UniMove</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/driver/unisend')}
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-[#003160]"
          >
            <Package size={28} className="text-[#003160]" />
            <span>UniSend</span>
          </Button>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Recent Activity</h3>
        
        {driverStats.isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">Loading activity...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {recentActivity.map(activity => (
              <div key={activity.id} className="p-4 flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  {activity.type === 'ride' ? (
                    <Bike size={20} className="text-[#003160]" />
                  ) : (
                    <Package size={20} className="text-[#003160]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${activity.amount.toFixed(2)}</p>
                  {activity.rating > 0 && (
                    <div className="text-xs flex items-center text-yellow-500">
                      <Star size={12} className="mr-1" />
                      <span>{activity.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
      
      {/* Driver Performance */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-700 mb-3">This Week's Summary</h3>
        <div className="bg-white rounded-lg shadow-sm p-4 grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <TrendingUp size={20} className="text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Earnings</p>
              <p className="font-bold">${driverStats.earnings}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar size={20} className="text-[#003160] mr-2" />
            <div>
              <p className="text-sm text-gray-500">Active Days</p>
              <p className="font-bold">{driverStats.activedays || '-'} days</p>
            </div>
          </div>
          <div className="flex items-center">
            <PieChart size={20} className="text-[#003160] mr-2" />
            <div>
              <p className="text-sm text-gray-500">Acceptance Rate</p>
              <p className="font-bold">{driverStats.acceptanceRate || '-'}%</p>
            </div>
          </div>
          <div className="flex items-center">
            <Navigation size={20} className="text-[#003160] mr-2" />
            <div>
              <p className="text-sm text-gray-500">Distance</p>
              <p className="font-bold">{driverStats.distance || '-'} km</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation driverType={user?.driver_type} />
    </div>
  );
};

export default DriverDashboard;
