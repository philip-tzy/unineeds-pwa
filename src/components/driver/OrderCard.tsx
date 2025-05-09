
import React from 'react';
import { User, Star, X, Check, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/unimove';

interface OrderCardProps {
  order: Order;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
  loading?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onAccept, 
  onDecline, 
  loading 
}) => {
  const getCustomerName = (customerId: string) => {
    return `Customer ${customerId.slice(0, 5)}`;
  };

  const getCustomerRating = () => {
    return (4 + Math.random()).toFixed(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{getCustomerName(order.customer_id)}</p>
            <div className="flex items-center text-yellow-500 text-xs">
              <Star size={12} className="mr-1" />
              <span>{getCustomerRating()}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#003160]">${order.total_amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">
            {order.created_at
              ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now'}
          </p>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-start mb-2">
          <div className="mt-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm">{order.pickup_address || 'Unknown location'}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="mt-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm">{order.delivery_address || 'Unknown location'}</p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-gray-300 text-gray-700"
          onClick={() => onDecline(order)}
        >
          <X size={16} className="mr-1" />
          Decline
        </Button>
        <Button
          className="flex-1 bg-[#003160] hover:bg-[#002040] text-white"
          onClick={() => onAccept(order)}
          disabled={loading}
        >
          <Check size={16} className="mr-1" />
          {loading ? 'Accepting...' : 'Accept'}
        </Button>
      </div>
    </div>
  );
};

export default OrderCard;
