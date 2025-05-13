import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MapPin, Package, Car, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import OrderCard from '@/components/driver/OrderCard';
import CurrentRidePanel from '@/components/driver/CurrentRidePanel';
import MapComponent from '@/components/MapComponent';
import { useDriverOrders } from '@/hooks/useDriverOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/types/unimove';
import { diagnoseRealtimeIssues } from '@/services/realtimeCheck';

const DriverUniMove: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [showRideRequests, setShowRideRequests] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'rides' | 'deliveries'>('all');
  const [connectionIssues, setConnectionIssues] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(true);
  
  const {
    status,
    pendingOrders,
    currentOrder,
    loading,
    acceptRide,
    declineRide,
    completePickup,
    completeRide,
    findNewRide,
  } = useDriverOrders(user?.id);

  // Check realtime connection when component mounts
  useEffect(() => {
    const checkRealtimeSetup = async () => {
      try {
        const issues = await diagnoseRealtimeIssues();
        setConnectionIssues(issues);
        
        if (issues.length > 0) {
          console.error('Found issues with realtime connection:', issues);
          toast({
            title: "Connection Issues Detected",
            description: "There may be issues with order notifications. Check console for details.",
            variant: "destructive"
          });
        } else {
          console.log('Realtime connection checked - no issues found');
        }
      } catch (error) {
        console.error('Error checking realtime setup:', error);
        setConnectionIssues([String(error)]);
      } finally {
        setInitializing(false);
      }
    };
    
    checkRealtimeSetup();
  }, [toast]);

  // Update driver availability in database
  useEffect(() => {
    if (!user) return;
    
    const updateAvailability = async () => {
      try {
        console.log(`Updating driver ${user.id} availability to ${isAvailable ? 'available' : 'unavailable'}`);
        
        // Update in drivers table
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert({
            id: user.id,
            name: user.name || user.email || 'Driver',
            is_available: isAvailable,
            updated_at: new Date().toISOString()
          });
        
        if (driverError) {
          console.error('Error updating driver availability in drivers table:', driverError);
          throw driverError;
        }
        
        // Also update the user record for consistency
        const { error: userError } = await supabase
          .from('profiles')
          .update({
            is_available: isAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (userError) {
          console.error('Error updating availability in profiles table:', userError);
        }
        
        console.log('Driver availability updated successfully');
      } catch (error) {
        console.error('Error updating driver availability:', error);
        toast({
          title: "Error",
          description: "Failed to update your availability status",
          variant: "destructive",
        });
      }
    };
    
    updateAvailability();
  }, [user, isAvailable, toast]);

  const handleToggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast({
      title: isAvailable ? "You're now offline" : "You're now online",
      description: isAvailable 
        ? "You won't receive ride or delivery requests" 
        : "You'll start receiving ride and delivery requests",
    });
  };
  
  // Manually refresh pending orders
  const handleRefreshOrders = async () => {
    try {
      toast({
        title: "Refreshing",
        description: "Looking for new orders...",
      });
      
      // Force a check for pending orders
      const { data: pendingOrdersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`service_type.eq.unimove,service_type.eq.unisend`)
        .eq('status', 'pending')
        .is('driver_id', null);
      
      if (ordersError) {
        throw ordersError;
      }
      
      const count = pendingOrdersData?.length || 0;
      
      toast({
        title: count > 0 ? `${count} Orders Found` : "No New Orders",
        description: count > 0 
          ? `${count} orders are available for you` 
          : "No new orders at the moment",
      });
      
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast({
        title: "Error",
        description: "Failed to refresh orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRide = async (order: Order) => {
    await acceptRide(order);
    setShowRideRequests(false);
  };
  
  // Filter orders based on selected filter
  const filteredOrders = pendingOrders.filter(order => {
    if (filterType === 'all') return true;
    if (filterType === 'rides') return order.service_type !== 'unisend';
    if (filterType === 'deliveries') return order.service_type === 'unisend';
    return true;
  });
  
  // Get appropriate themed color based on current order type
  const getServiceThemeColor = () => {
    if (!currentOrder) return '#003160';
    return currentOrder.service_type === 'unisend' ? '#003160' : '#003160';
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
          {currentOrder?.service_type === 'unisend' ? (
            <>
              <span className="text-[#003160]">Uni</span>
              <span className="text-black">Send</span>
              <span className="text-[#003160]"> Driver</span>
            </>
          ) : (
            <>
              <span className="text-[#003160]">Uni</span>
              <span className="text-black">Move</span>
              <span className="text-[#003160]"> Driver</span>
            </>
          )}
        </h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={24} />
        </button>
      </div>
      
      {/* Connection issues warning */}
      {connectionIssues.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-2 mx-2 rounded">
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              Connection issues detected. Notifications may not work properly.
            </p>
          </div>
          <button 
            onClick={() => console.log('Connection issues:', connectionIssues)} 
            className="text-xs text-yellow-800 underline mt-1"
          >
            See details in console
          </button>
        </div>
      )}
      
      {/* Map with real-time tracking */}
      <MapComponent order={currentOrder} isDriver={true} />
      
      {/* Availability Toggle */}
      <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
        <button
          onClick={handleToggleAvailability}
          className={`py-2 px-4 rounded-full shadow-md flex items-center ${
            isAvailable 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          <span className="mr-2">
            {isAvailable ? 'Available for Orders' : 'Unavailable'}
          </span>
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-white' : 'bg-gray-400'}`}></div>
        </button>
      </div>
      
      <div className="absolute bottom-16 right-4 bg-white p-2 rounded-full shadow-lg z-10">
        <button 
          onClick={handleRefreshOrders}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
          aria-label="Refresh orders"
          title="Refresh orders"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10">
        <MapPin size={24} className="text-[#003160]" />
      </div>
      
      {/* Ride Status Panel */}
      <div className="bg-white rounded-t-3xl -mt-5 min-h-[65vh] shadow-lg relative z-10 animate-slide-in">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        {initializing ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-[#003160] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Initializing connection...</p>
          </div>
        ) : status === 'searching' && showRideRequests ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Available Requests {filteredOrders.length > 0 && `(${filteredOrders.length})`}</h2>
              
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setFilterType('all')} 
                  className={`text-xs px-3 py-1 rounded-md ${filterType === 'all' ? 'bg-white shadow-sm' : ''}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('rides')} 
                  className={`text-xs px-3 py-1 rounded-md flex items-center ${filterType === 'rides' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Car size={12} className="mr-1" /> Rides
                </button>
                <button 
                  onClick={() => setFilterType('deliveries')} 
                  className={`text-xs px-3 py-1 rounded-md flex items-center ${filterType === 'deliveries' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Package size={12} className="mr-1" /> Deliveries
                </button>
              </div>
            </div>
            
            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAcceptRide}
                    onDecline={declineRide}
                    loading={loading}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-700">No requests available</h3>
                <p className="text-gray-500 mt-1">Wait for new requests or check back later</p>
                <button 
                  onClick={handleRefreshOrders}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Check for new orders
                </button>
              </div>
            )}
          </div>
        ) : (status === 'accepting' || status === 'ongoing' || status === 'completed') && currentOrder ? (
          <CurrentRidePanel
            status={status}
            order={currentOrder}
            onPickupComplete={completePickup}
            onCompleteRide={completeRide}
            onFindNewRide={findNewRide}
          />
        ) : null}
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverUniMove;
