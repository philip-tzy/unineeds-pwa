import React from 'react';
import { User, Star, Phone, Bell, Navigation, Package } from 'lucide-react';
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
  
  // Determine if this is a delivery or ride order
  const isDelivery = order.service_type === 'unisend';
  
  // Set colors based on service type
  const themeColor = '#003160';
  const hoverColor = '#002040';
  
  // Status labels based on service type
  const statusLabels = {
    accepting: isDelivery ? 'Picking up package' : 'Picking up passenger',
    ongoing: isDelivery ? 'Delivering package' : 'En route to destination',
    completed: isDelivery ? 'Delivery completed' : 'Ride completed'
  };
  
  // Action labels based on service type
  const actionLabels = {
    confirm: isDelivery ? 'Confirm Package Pickup' : 'Confirm Pickup',
    complete: isDelivery ? 'Complete Delivery' : 'Complete Ride',
    findNew: isDelivery ? 'Find New Delivery' : 'Find Another Ride'
  };

  return (
    <div className="p-4">
      <div className={`bg-[${themeColor}] text-white p-4 rounded-xl mb-4`} style={{ backgroundColor: themeColor }}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">
            {statusLabels[status]}
          </h3>
          <div className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
            {status === 'accepting' && 'Arriving'}
            {status === 'ongoing' && 'In progress'}
            {status === 'completed' && 'Finished'}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
            {isDelivery ? (
              <Package size={20} style={{ color: themeColor }} />
            ) : (
              <User size={20} style={{ color: themeColor }} />
            )}
          </div>
          <div>
            <p className="font-medium">
              {isDelivery ? 'Package Delivery' : getCustomerName(order.customer_id)}
            </p>
            {!isDelivery && (
              <div className="flex items-center text-yellow-300 text-xs">
                <Star size={12} className="mr-1" />
                <span>{getCustomerRating()}</span>
              </div>
            )}
            {isDelivery && order.package_size && (
              <div className="text-xs text-white text-opacity-80">
                {order.package_size} Package
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-white bg-opacity-10 p-3 rounded-lg">
          <div>
            <p className="text-xs opacity-80">{isDelivery ? 'Earnings' : 'Fare'}</p>
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
          <Button variant="ghost" size="sm" className="h-8" style={{ color: themeColor }}>
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
          <Button variant="ghost" size="sm" className="h-8" style={{ color: themeColor }}>
            <Navigation size={16} className="mr-1" />
            Navigate
          </Button>
        </div>
      </div>
      
      {/* Contact options */}
      {!isDelivery && (
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
      )}
      
      {/* Customer info for delivery orders */}
      {isDelivery && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Customer</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium">{getCustomerName(order.customer_id)}</span>
            <button className="text-[#003160] text-sm flex items-center">
              Call <Phone size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {status === 'accepting' && (
        <Button 
          className="w-full h-12"
          style={{ backgroundColor: themeColor, color: 'white' }}
          onClick={onPickupComplete}
        >
          {actionLabels.confirm}
        </Button>
      )}
      
      {status === 'ongoing' && (
        <Button 
          className="w-full h-12"
          style={{ backgroundColor: themeColor, color: 'white' }}
          onClick={onCompleteRide}
        >
          {actionLabels.complete}
        </Button>
      )}
      
      {status === 'completed' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-green-700 font-medium mb-1">
              {isDelivery ? 'Delivery' : 'Ride'} Completed Successfully
            </h3>
            <p className="text-green-600 text-sm">You've earned ${order.total_amount.toFixed(2)}</p>
          </div>
          
          <Button 
            className="w-full h-12"
            style={{ backgroundColor: themeColor, color: 'white' }}
            onClick={onFindNewRide}
          >
            {actionLabels.findNew}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CurrentRidePanel;
