
import React, { useState } from 'react';
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

const UniMove: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRide, setSelectedRide] = useState(rideOptions[0].id);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [showDrivers, setShowDrivers] = useState(false);
  
  const {
    order,
    status,
    loading,
    requestRide,
    cancelRide
  } = useCustomerRide(user?.id);
  
  const handleLocationSelect = (location: typeof recentLocations[0]) => {
    if (!toLocation) {
      setToLocation(location.address);
    } else {
      setFromLocation(location.address);
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
    
    // Get the price from the selected ride option
    const selectedRideOption = rideOptions.find(option => option.id === selectedRide);
    const price = selectedRideOption ? selectedRideOption.price : 5.99;
    
    requestRide(fromLocation, toLocation, price);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
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
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>
      
      {/* Map with real-time tracking */}
      <MapComponent order={order} />
      
      {/* Ride Selection Panel */}
      <div className="bg-white rounded-t-3xl -mt-5 min-h-[65vh] shadow-lg relative z-10 animate-slide-in">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
        
        {/* Current Order Status */}
        {order && (
          <div className="p-4 mb-2">
            <div className={cn(
              "p-4 rounded-lg",
              order.status === 'pending' ? "bg-yellow-50 border border-yellow-200" :
              order.status === 'accepted' ? "bg-green-50 border border-green-200" :
              order.status === 'in_progress' ? "bg-blue-50 border border-blue-200" :
              "bg-gray-50 border border-gray-200"
            )}>
              <h3 className="font-medium mb-1">
                {order.status === 'pending' ? "Waiting for driver..." :
                 order.status === 'accepted' ? "Driver is on the way!" :
                 order.status === 'in_progress' ? "En route to destination" :
                 order.status === 'completed' ? "Ride completed" :
                 "Ride status: " + order.status}
              </h3>
              <div className="text-sm">
                <p><span className="font-medium">From:</span> {order.pickup_address}</p>
                <p><span className="font-medium">To:</span> {order.delivery_address}</p>
                {order.status !== 'completed' && (
                  <button 
                    onClick={cancelRide}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Show ride request form (only shown if not selecting driver and no current order) */}
        {!showDrivers && !order && (
          <div className="p-4">
            <div className="bg-gray-100 rounded-xl p-3 mb-4">
              <div className="flex items-center mb-3">
                <div className="bg-[#003160] w-2 h-2 rounded-full mr-3"></div>
                <input 
                  type="text" 
                  placeholder="Current location" 
                  className="bg-transparent flex-1 outline-none text-sm"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <div className="bg-red-500 w-2 h-2 rounded-full mr-3"></div>
                <input 
                  type="text" 
                  placeholder="Where to?" 
                  className="bg-transparent flex-1 outline-none text-sm" 
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                />
                <Search size={18} className="text-gray-400" />
              </div>
            </div>
            
            {/* Recent Locations */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Recent</h3>
              <div className="space-y-3">
                {recentLocations.map((location) => (
                  <div 
                    key={location.id} 
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                      {location.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{location.name}</p>
                      <p className="text-xs text-gray-500">{location.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Ride Options */}
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
              className="w-full bg-[#003160] hover:bg-[#002040] text-white font-bold py-3 px-4 rounded-xl mt-4 transition-colors duration-200 flex items-center justify-center"
            >
              Request Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniMove;
