import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Car, 
  MapPin, 
  Search, 
  ArrowLeft, 
  Clock,
  Star,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import MapComponent from '@/components/MapComponent';
import { useCustomerRide } from '@/hooks/useCustomerRide';
import { supabase } from '@/integrations/supabase/client';
import { createRideRequest, createRideRequestSecure } from '@/services/api';
import { subscribeToUserNotifications } from '@/services/notification';
import DriverInfoPanel from '@/components/customer/DriverInfoPanel';

// Fake ride options data
const rideOptions = [
  {
    id: 'bike',
    name: 'Bike',
    icon: <Bike size={18} />,
    price: 2.99,
    time: '5-10',
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: <Car size={18} />,
    price: 5.99,
    time: '8-12',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: <Car size={18} />,
    price: 8.99,
    time: '8-12',
  },
];

// Recent locations
const recentLocations = [
  { id: 1, name: 'Home', address: '123 Maple Street', icon: <MapPin size={18} /> },
  { id: 2, name: 'Work', address: '456 Oak Avenue', icon: <MapPin size={18} /> },
  { id: 3, name: 'University', address: 'Campus Main Building', icon: <MapPin size={18} /> },
];

// Convert address to coordinates (mock implementation)
// In a real app, this would use a geocoding service
const getCoordinatesFromAddress = (address: string): [number, number] => {
  // Default to Jakarta coordinates and add small random offset for demo
  const baseCoords: [number, number] = [-6.2088, 106.8456];
  
  // Generate a random offset (-0.01 to 0.01)
  const randomLat = Math.random() * 0.02 - 0.01;
  const randomLng = Math.random() * 0.02 - 0.01;
  
  return [baseCoords[0] + randomLat, baseCoords[1] + randomLng];
};

// Add a new function for showing a visual notification
const OrderStatusNotification = ({ order }) => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [prevStatus, setPrevStatus] = useState(order?.status);
  
  useEffect(() => {
    // If status changed, trigger the animation
    if (order?.status !== prevStatus) {
      setShowAnimation(true);
      setPrevStatus(order?.status);
      
      // Reset animation after 5 seconds
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 5000);
      
      // Debug logging
      console.log("OrderStatusNotification - order status changed:", {
        newStatus: order?.status,
        prevStatus,
        driverId: order?.driver_id,
        driverData: order?.driver
      });
      
      return () => clearTimeout(timer);
    }
  }, [order?.status, prevStatus]);
  
  if (!showAnimation || !order) return null;
  
  return (
    <div className="fixed top-20 left-0 right-0 z-50 flex justify-center items-center">
      <div className={cn(
        "py-4 px-6 rounded-xl shadow-lg max-w-sm w-full transform transition-all duration-500",
        showAnimation ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0",
        order.status === 'accepted' ? "bg-green-100 border-l-4 border-green-500" :
        order.status === 'in_progress' ? "bg-blue-100 border-l-4 border-blue-500" :
        order.status === 'completed' ? "bg-purple-100 border-l-4 border-purple-500" :
        "bg-yellow-100 border-l-4 border-yellow-500"
      )}>
        <div className="flex items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mr-3",
            order.status === 'accepted' ? "bg-green-200 text-green-700" :
            order.status === 'in_progress' ? "bg-blue-200 text-blue-700" :
            order.status === 'completed' ? "bg-purple-200 text-purple-700" :
            "bg-yellow-200 text-yellow-700"
          )}>
            {order.status === 'accepted' ? <User size={18} /> :
             order.status === 'in_progress' ? <Car size={18} /> :
             order.status === 'completed' ? <MapPin size={18} /> :
             <Clock size={18} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">
              {order.status === 'accepted' ? "Driver Accepted Your Ride!" :
               order.status === 'in_progress' ? "Your Ride Has Started" :
               order.status === 'completed' ? "Ride Completed" :
               "Ride Status Updated"}
            </h3>
            <p className="text-sm text-gray-600">
              {order.status === 'accepted' ? (order.driver ? `${order.driver.name} is on the way` : "Driver is on the way to pick you up") :
               order.status === 'in_progress' ? "You are on your way to your destination" :
               order.status === 'completed' ? "Thank you for using UniMove" :
               "Your ride status has been updated"}
            </p>
            {order.status === 'accepted' && order.driver && (
              <p className="text-xs mt-1 text-gray-500">
                Driver Rating: {order.driver.rating || "4.5"} ⭐
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UniMove: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRide, setSelectedRide] = useState(rideOptions[0].id);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [showDrivers, setShowDrivers] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const {
    order,
    status,
    loading,
    requestRide,
    cancelRide
  } = useCustomerRide(user?.id);
  
  // Update coordinates when addresses change
  useEffect(() => {
    if (fromLocation) {
      setPickupCoords(getCoordinatesFromAddress(fromLocation));
    }
    
    if (toLocation) {
      setDestinationCoords(getCoordinatesFromAddress(toLocation));
    }
  }, [fromLocation, toLocation]);
  
  // Add debugging for order and driver info
  useEffect(() => {
    if (order) {
      console.log("UniMove - order status:", order.status);
      console.log("UniMove - order driver_id:", order.driver_id);
      console.log("UniMove - order driver data:", order.driver);
    }
  }, [order]);
  
  // Subscribe to notifications for this user
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = subscribeToUserNotifications(user.id, (payload) => {
      // Check if status changed to 'accepted'
      if (payload.new && payload.old && 
          payload.old.status !== 'accepted' && 
          payload.new.status === 'accepted') {
        
        setHasNewNotification(true);
        setNotificationMessage('Driver has accepted your ride!');
        
        // Play sound notification if browser supports it
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
        
        // Vibrate if device supports it
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        // Auto-hide notification after 8 seconds
        setTimeout(() => {
          setHasNewNotification(false);
        }, 8000);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [user?.id]);
  
  const handleLocationSelect = (location: typeof recentLocations[0]) => {
    if (!toLocation) {
      setToLocation(location.address);
    } else {
      setFromLocation(location.address);
    }
  };
  
  // Handle map location selection
  const handleMapLocationSelect = (coords: [number, number]) => {
    if (!pickupCoords) {
      setPickupCoords(coords);
      setFromLocation(`Location at ${coords[0].toFixed(4)},${coords[1].toFixed(4)}`);
    } else if (!destinationCoords) {
      setDestinationCoords(coords);
      setToLocation(`Location at ${coords[0].toFixed(4)},${coords[1].toFixed(4)}`);
    }
  };
  
  const handleRequestRide = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a ride",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (!fromLocation || !toLocation) {
      toast({
        title: "Incomplete Information",
        description: "Please enter pickup and destination locations",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure coordinates exist, generate if not available
    const pickupCoordinates = pickupCoords || getCoordinatesFromAddress(fromLocation);
    const destinationCoordinates = destinationCoords || getCoordinatesFromAddress(toLocation);
    
    // Get the price from the selected ride option
    const selectedRideOption = rideOptions.find(option => option.id === selectedRide);
    const price = selectedRideOption ? selectedRideOption.price : 5.99;
    
    try {
      // Use the secure version which has fallback mechanisms
      await createRideRequestSecure(user.id, fromLocation, toLocation, price);
      
      // Update UI
      toast({
        title: "Ride Requested",
        description: "Searching for drivers...",
      });
      
      // Call the hook's requestRide method to update local state
      requestRide(
        fromLocation, 
        toLocation, 
        pickupCoordinates,
        destinationCoordinates,
        price
      );
    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Error",
        description: "Failed to request ride. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
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
        </h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <User size={24} />
        </button>
      </div>
      
      {/* New Notification Toast */}
      {hasNewNotification && (
        <div className="fixed top-16 inset-x-0 flex justify-center z-50 mt-2">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 shadow-lg rounded-md animate-bounce max-w-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notificationMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button 
                    onClick={() => setHasNewNotification(false)}
                    className="inline-flex text-green-500 hover:text-green-600 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Notification */}
      {order && <OrderStatusNotification order={order} />}
      
      {/* Map */}
      <MapComponent 
        order={order} 
        isDriver={false}
        onLocationSelect={handleMapLocationSelect}
      />
      
      {/* Ride Panel */}
      <div className="bg-white rounded-t-3xl -mt-5 min-h-[65vh] shadow-lg">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        {order && (
          <div className="p-4 mb-2">
            {(order.status === 'accepted' || order.status === 'in_progress') && order.driver_id ? (
              <DriverInfoPanel 
                driverId={order.driver_id || ""}
                orderId={order.id}
                serviceType="unimove"
                orderStatus={order.status}
                pickupAddress={order.pickup_address || ""}
                destinationAddress={order.delivery_address || ""}
              />
            ) : (
              <div className={cn(
                "p-4 rounded-lg shadow-sm transition-all duration-300",
                order.status === 'pending' ? "bg-yellow-50 border border-yellow-200" :
                order.status === 'completed' ? "bg-purple-50 border border-purple-200" :
                order.status === 'cancelled' ? "bg-red-50 border border-red-200" :
                "bg-gray-50 border border-gray-200"
              )}>
                <h3 className="font-medium mb-1">
                  {order.status === 'pending' ? "Waiting for driver..." :
                   order.status === 'completed' ? "Ride completed" :
                   order.status === 'cancelled' ? "Ride cancelled" :
                   "Ride status: " + order.status}
                </h3>
                <div className="text-sm">
                  <p><span className="font-medium">From:</span> {order.pickup_address}</p>
                  <p><span className="font-medium">To:</span> {order.delivery_address}</p>
                  
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button 
                      onClick={cancelRide}
                      className="mt-3 text-sm text-red-600 hover:underline"
                    >
                      Cancel Ride
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Show ride request form (only shown if not selecting driver and no current order) */}
        {!order && (
          <div className="p-4">
            <div className="space-y-4">
              {/* Location Inputs */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Pickup and Destination</h3>
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-5 w-px bg-gray-300" style={{ top: '2.5rem', height: 'calc(100% - 5rem)' }}></div>
                  
                  <div className="relative flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200 z-10">
                      <MapPin size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Pickup location"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      className="flex-1 ml-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 border border-red-200 z-10">
                      <MapPin size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Destination"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      className="flex-1 ml-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Recent Locations */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Recent Locations</h3>
                <div className="grid grid-cols-3 gap-2">
                  {recentLocations.map((location) => (
                    <div 
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="p-2 border border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        {location.icon}
                      </div>
                      <p className="text-xs font-medium">{location.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Ride Types */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700">Select Ride</h3>
                <div className="space-y-2">
                  {rideOptions.map((option) => (
                    <div 
                      key={option.id}
                      onClick={() => setSelectedRide(option.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                        selectedRide === option.id 
                          ? "border-[#003160] bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                          selectedRide === option.id ? "bg-[#003160] text-white" : "bg-gray-100 text-gray-500"
                        )}>
                          {option.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{option.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>{option.time} min</span>
                            
                            <Star size={12} className="ml-2 mr-1 text-yellow-500" />
                            <span>4.8</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${option.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Request Ride Button */}
              <button 
                onClick={handleRequestRide}
                disabled={loading}
                className={`w-full font-bold py-3 px-4 rounded-xl mt-4 transition-colors duration-200 flex items-center justify-center ${
                  loading 
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                    : "bg-[#003160] hover:bg-[#002040] text-white"
                }`}
              >
                {loading ? "Processing..." : "Request Ride"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniMove;
