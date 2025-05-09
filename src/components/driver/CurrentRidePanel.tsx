
import React from 'react';
import { User, Star, Phone, Bell, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order, RideStatus } from '@/types/unimove';

interface CurrentRidePanelProps {
  status: RideStatus;
  order: Order;
  onPickupComplete: () => void;
  onCompleteRide: () => void;
  onFindNewRide: () => void;
}

const CurrentRidePanel: React.FC<CurrentRidePanelProps> = ({
  status,
  order,
  onPickupComplete,
  onCompleteRide,
  onFindNewRide,
}) => {
  const getCustomerName = (customerId: string) => {
    return `Customer ${customerId.slice(0, 5)}`;
  };

  const getCustomerRating = () => {
    return (4 + Math.random()).toFixed(1);
  };

  return (
    <div className="p-4">
      <div className="bg-[#003160] text-white p-4 rounded-xl mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">
            {status === 'accepting' && 'Picking up passenger'}
            {status === 'ongoing' && 'En route to destination'}
            {status === 'completed' && 'Ride completed'}
          </h3>
          <div className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
            {status === 'accepting' && 'Arriving'}
            {status === 'ongoing' && 'In progress'}
            {status === 'completed' && 'Finished'}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
            <User size={20} className="text-[#003160]" />
          </div>
          <div>
            <p className="font-medium">{getCustomerName(order.customer_id)}</p>
            <div className="flex items-center text-yellow-300 text-xs">
              <Star size={12} className="mr-1" />
              <span>{getCustomerRating()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-white bg-opacity-10 p-3 rounded-lg">
          <div>
            <p className="text-xs opacity-80">Fare</p>
            <p className="font-bold">${order.total_amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Distance</p>
            <p className="font-bold">{(Math.random() * 5 + 1).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Time</p>
            <p className="font-bold">{Math.floor(Math.random() * 15 + 5)} min</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-start mb-4">
          <div className="mt-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm font-medium">{order.pickup_address || 'Unknown location'}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[#003160]">
            <Navigation size={16} className="mr-1" />
            Navigate
          </Button>
        </div>
        
        <div className="flex items-start">
          <div className="mt-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium">{order.delivery_address || 'Unknown location'}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[#003160]">
            <Navigation size={16} className="mr-1" />
            Navigate
          </Button>
        </div>
      </div>
      
      <div className="flex gap-3 mb-4">
        <Button variant="outline" className="flex-1 h-12">
          <Phone size={16} className="mr-2" />
          Call
        </Button>
        <Button variant="outline" className="flex-1 h-12">
          <Bell size={16} className="mr-2" />
          Notify
        </Button>
      </div>
      
      {status === 'accepting' && (
        <Button 
          className="w-full bg-[#003160] hover:bg-[#002040] text-white h-12"
          onClick={onPickupComplete}
        >
          Confirm Pickup
        </Button>
      )}
      
      {status === 'ongoing' && (
        <Button 
          className="w-full bg-[#003160] hover:bg-[#002040] text-white h-12"
          onClick={onCompleteRide}
        >
          Complete Ride
        </Button>
      )}
      
      {status === 'completed' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-green-700 font-medium mb-1">Ride Completed Successfully</h3>
            <p className="text-green-600 text-sm">You've earned ${order.total_amount.toFixed(2)}</p>
          </div>
          
          <Button 
            className="w-full bg-[#003160] hover:bg-[#002040] text-white h-12"
            onClick={onFindNewRide}
          >
            Find Another Ride
          </Button>
        </div>
      )}
    </div>
  );
};

export default CurrentRidePanel;
