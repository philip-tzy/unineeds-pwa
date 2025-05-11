import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Star, User, MapPin, Car, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Extended driver profile type
interface DriverInfo {
  id: string;
  name: string;
  profile_image?: string;
  phone?: string;
  rating?: number;
  total_trips?: number;
  current_location?: [number, number];
  vehicle_type?: string;
  license_plate?: string;
  last_updated?: string;
}

interface DriverInfoPanelProps {
  driverId: string;
  orderId: string;
  serviceType: 'unimove' | 'unisend';
  orderStatus: string;
  pickupAddress: string;
  destinationAddress: string;
}

const DriverInfoPanel: React.FC<DriverInfoPanelProps> = ({
  driverId,
  orderId,
  serviceType,
  orderStatus,
  pickupAddress,
  destinationAddress
}) => {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [locationUpdates, setLocationUpdates] = useState<number>(0);

  // Fetch driver information
  useEffect(() => {
    if (!driverId) return;

    const fetchDriverInfo = async () => {
      try {
        setLoading(true);
        
        // Fetch driver information from the drivers table
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('id, name, rating, total_rides')
          .eq('id', driverId)
          .single();

        if (driverError) {
          console.error('Error fetching driver data:', driverError);
          // Try to fetch from profiles as fallback
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', driverId)
            .single();
            
          if (profileError) {
            throw profileError;
          }
          
          // Use profile data as fallback
          const fallbackDriver: DriverInfo = {
            id: profileData.id,
            name: profileData.full_name || 'Driver',
            profile_image: profileData.avatar_url,
            rating: 4.5,  // Default rating
            total_trips: 0,
            vehicle_type: serviceType === 'unimove' ? 'Car' : 'Motorcycle',
            license_plate: 'N/A'
          };
          
          setDriver(fallbackDriver);
          setLoading(false);
          return;
        }

        // Create driver info from the fetched data
        const driverInfo: DriverInfo = {
          id: driverData.id,
          name: driverData.name || 'Driver',
          rating: driverData.rating || 4.5,
          total_trips: driverData.total_rides || 0,
          vehicle_type: serviceType === 'unimove' ? 'Car' : 'Motorcycle',
          license_plate: 'N/A'
        };

        // Set initial estimated time based on order status
        if (orderStatus === 'accepted') {
          setEstimatedTime(8);
        } else if (orderStatus === 'in_progress') {
          setEstimatedTime(12);
        }

        setDriver(driverInfo);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching driver information:', error);
        
        // Create minimal driver info if fetch fails
        const fallbackDriver: DriverInfo = {
          id: driverId,
          name: 'Driver',
          rating: 4.5,
          total_trips: 0,
          vehicle_type: serviceType === 'unimove' ? 'Car' : 'Motorcycle',
          license_plate: 'N/A'
        };
        
        setDriver(fallbackDriver);
        setLoading(false);
      }
    };

    fetchDriverInfo();

    // Subscribe to driver updates (simplified for now)
    // In a real app, you would use the realtime subscriptions
    // for the actual driver locations table

    // Simulate location updates for demo purposes
    const locationUpdateInterval = setInterval(() => {
      // Simulate a location update
      setLocationUpdates(prev => prev + 1);
      
      // Update the estimated time
      if (orderStatus === 'accepted') {
        setEstimatedTime(prev => Math.max(1, prev - 1));
      } else if (orderStatus === 'in_progress') {
        setEstimatedTime(prev => Math.max(1, prev - 1));
      }
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(locationUpdateInterval);
    };
  }, [driverId, orderStatus, serviceType]);

  // Calculate how long ago the location was updated
  const getTimeAgo = (): string => {
    return "Just now";
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-500">Driver information unavailable</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300",
      locationUpdates > 0 && "border-blue-300 shadow-blue-100"
    )}>
      {/* Driver Status Banner */}
      <div className={cn(
        "p-3 text-center text-white font-medium",
        orderStatus === 'accepted' ? "bg-blue-500" : 
        orderStatus === 'in_progress' ? "bg-green-500" : "bg-gray-500"
      )}>
        {orderStatus === 'accepted' 
          ? "Driver is on the way to pick you up" 
          : orderStatus === 'in_progress'
          ? "En route to your destination"
          : "Connecting with your driver"}
      </div>
      
      {/* Driver Information */}
      <div className="p-4">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md">
              {driver.profile_image ? (
                <img 
                  src={driver.profile_image} 
                  alt={driver.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-full h-full p-4 text-gray-400" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              {serviceType === 'unimove' ? (
                <Car size={12} className="text-white" />
              ) : (
                <Bike size={12} className="text-white" />
              )}
            </div>
          </div>
          
          <div className="ml-4 flex-1">
            <h3 className="font-semibold text-lg">{driver.name}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Star size={14} className="text-yellow-500 fill-current mr-1" />
              <span>{driver.rating}</span>
              <span className="mx-1">•</span>
              <span>{driver.total_trips} trips</span>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              {driver.vehicle_type} • {driver.license_plate}
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button size="sm" variant="outline" className="rounded-full p-2 h-auto w-auto">
              <Phone size={18} className="text-blue-600" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full p-2 h-auto w-auto">
              <MessageSquare size={18} className="text-blue-600" />
            </Button>
          </div>
        </div>
        
        {/* Estimated Time & Trip Details */}
        <div className={cn(
          "mt-4 p-3 rounded-lg",
          orderStatus === 'accepted' 
            ? "bg-blue-50 border border-blue-100" 
            : "bg-green-50 border border-green-100"
        )}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">
                {orderStatus === 'accepted' 
                  ? "Estimated pickup time" 
                  : "Estimated arrival time"}
              </p>
              <p className="text-xs text-gray-500">
                {getTimeAgo()}
              </p>
            </div>
            <div className="text-xl font-bold">
              {estimatedTime || "?"} min
            </div>
          </div>
        </div>
        
        {/* Trip Route Info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start">
            <div className="mt-1 min-w-[24px]">
              <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
            </div>
            <div className="ml-2">
              <p className="text-xs text-gray-500">PICKUP</p>
              <p className="text-sm">{pickupAddress}</p>
            </div>
          </div>
          
          <div className="flex items-start pl-3">
            <div className="h-12 w-0 border-l border-dashed border-gray-300"></div>
          </div>
          
          <div className="flex items-start">
            <div className="mt-1 min-w-[24px]">
              <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500"></div>
            </div>
            <div className="ml-2">
              <p className="text-xs text-gray-500">DESTINATION</p>
              <p className="text-sm">{destinationAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInfoPanel; 