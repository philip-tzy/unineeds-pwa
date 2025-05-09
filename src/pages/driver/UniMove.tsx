
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MapPin } from 'lucide-react';
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

const DriverUniMove: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [showRideRequests, setShowRideRequests] = useState(true);
  
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

  // Update driver availability in database
  useEffect(() => {
    if (!user) return;
    
    const updateAvailability = async () => {
      try {
        const { error } = await supabase
          .from('drivers')
          .upsert({
            id: user.id,
            name: user.name,
            is_available: isAvailable
          });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error updating driver availability:', error);
      }
    };
    
    updateAvailability();
  }, [user, isAvailable]);

  const handleToggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast({
      title: isAvailable ? "You're now offline" : "You're now online",
      description: isAvailable 
        ? "You won't receive ride requests" 
        : "You'll start receiving ride requests",
    });
  };

  const handleAcceptRide = async (order: Order) => {
    await acceptRide(order);
    setShowRideRequests(false);
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
          <span className="text-[#003160]">Uni</span>
          <span className="text-black">Move</span>
          <span className="text-[#003160]"> Driver</span>
        </h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={24} />
        </button>
      </div>
      
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
            {isAvailable ? 'Available for Rides' : 'Unavailable'}
          </span>
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-white' : 'bg-gray-400'}`}></div>
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10">
        <MapPin size={24} className="text-[#003160]" />
      </div>
      
      {/* Ride Status Panel */}
      <div className="bg-white rounded-t-3xl -mt-5 min-h-[65vh] shadow-lg relative z-10 animate-slide-in">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        {status === 'searching' && showRideRequests && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Ride Requests</h2>
            
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
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
                <h3 className="text-lg font-medium text-gray-700">No ride requests</h3>
                <p className="text-gray-500 mt-1">Wait for new requests or check back later</p>
              </div>
            )}
          </div>
        )}
        
        {(status === 'accepting' || status === 'ongoing' || status === 'completed') && currentOrder && (
          <CurrentRidePanel
            status={status}
            order={currentOrder}
            onPickupComplete={completePickup}
            onCompleteRide={completeRide}
            onFindNewRide={findNewRide}
          />
        )}
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverUniMove;
