
import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSummary {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: string;
}

interface ActiveOrdersListProps {
  orders: OrderSummary[];
  onOrderStatusChange: (orderId: string, newStatus: string) => void;
}

const ActiveOrdersList: React.FC<ActiveOrdersListProps> = ({
  orders,
  onOrderStatusChange
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Active Orders</h2>
        <button className="text-[#003160] text-sm">View All</button>
      </div>
      
      <div className="space-y-3">
        {orders.length > 0 ? (
          orders.map(order => (
            <div key={order.id} className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'Ready for Pickup' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {order.customer} • {order.items} item(s)
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-[#003160] text-[#003160] hover:bg-[#003160] hover:text-white"
                  onClick={() => onOrderStatusChange(
                    order.id, 
                    order.status === 'Preparing' ? 'Ready for Pickup' : 'Completed'
                  )}
                >
                  {order.status === 'Preparing' ? 'Mark Ready' : 'Complete'}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Clock className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-gray-500">No active orders at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveOrdersList;
