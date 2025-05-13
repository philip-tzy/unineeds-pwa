import React from 'react';
import { MapPin, Clock, DollarSign, User, Package } from 'lucide-react';
import type { Order } from '@/types/unimove';
import { Button } from '@/components/ui/button';

interface OrderCardProps {
  order: Order;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
  loading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAccept,
  onDecline,
  loading
}) => {
  // Calculate estimated distance (mock implementation)
  const estimatedDistance = () => {
    if (!order.pickup_coordinates || !order.delivery_coordinates) return '-- km';
    
    // Simple distance formula (not accurate for real world)
    const lat1 = order.pickup_coordinates[0];
    const lon1 = order.pickup_coordinates[1];
    const lat2 = order.delivery_coordinates[0];
    const lon2 = order.delivery_coordinates[1];
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    
    return `${d.toFixed(1)} km`;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };
  
  // Calculate estimated time (mock implementation)
  const estimatedTime = () => {
    const avgSpeed = 30; // km/h
    if (!order.pickup_coordinates || !order.delivery_coordinates) return '-- min';
    
    // Get distance
    const distanceStr = estimatedDistance();
    const distance = parseFloat(distanceStr.split(' ')[0]);
    
    // Calculate time in minutes
    const timeMinutes = (distance / avgSpeed) * 60;
    return `${Math.round(timeMinutes)} min`;
  };
  
  // Determine if this is a delivery or ride order
  const isDelivery = order.service_type === 'unisend';
  
  // Set colors based on service type
  const themeColor = '#003160';
  const hoverColor = '#002040';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {isDelivery ? (
              <Package size={16} className={`text-[${themeColor}] mr-2`} />
            ) : (
              <User size={16} className={`text-[${themeColor}] mr-2`} />
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {isDelivery ? 'Delivery Request' : (order.customer?.name || 'Customer')}
              </h3>
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" />
                <span>Requested {new Date(order.created_at || '').toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">${order.total_amount?.toFixed(2)}</div>
            <div className="text-xs text-gray-500 flex items-center justify-end">
              <DollarSign size={12} className="mr-1" />
              <span>Estimated {isDelivery ? 'earnings' : 'fare'}</span>
            </div>
          </div>
        </div>
        
        {/* Package size badge for delivery orders */}
        {isDelivery && (
          <div className="mb-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              {order.package_size || 'Standard'} Package
            </span>
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-500 mt-0.5 mr-2">
              <MapPin size={12} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Pickup</div>
              <div className="text-sm font-medium text-gray-900">{order.pickup_address}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 mt-0.5 mr-2">
              <MapPin size={12} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Destination</div>
              <div className="text-sm font-medium text-gray-900">{order.delivery_address}</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <div>Distance: {estimatedDistance()}</div>
          <div>Estimated time: {estimatedTime()}</div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onDecline(order)}
            className="flex-1"
            disabled={loading}
          >
            Decline
          </Button>
          <Button 
            onClick={() => onAccept(order)}
            className={`flex-1 bg-[${themeColor}] hover:bg-[${hoverColor}]`}
            style={{ backgroundColor: themeColor }}
            disabled={loading}
          >
            {loading ? "Accepting..." : "Accept"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

