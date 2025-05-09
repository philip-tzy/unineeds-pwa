import React from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderDetailProps {
  order: Order;
  onStatusChange: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, onStatusChange }) => {
  const updateOrderStatus = async (newStatus: Order['order_status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      toast.success('Order status updated successfully');
      onStatusChange();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">
            {format(new Date(order.created_at), 'PPp')}
          </p>
        </div>
        <Badge className={getStatusColor(order.order_status)}>
          {order.order_status}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm">
          <span className="font-medium">Quantity:</span> {order.quantity}
        </p>
        <p className="text-sm">
          <span className="font-medium">Total Price:</span> ${order.total_price.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-2">
        {order.order_status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateOrderStatus('processing')}
            >
              Accept Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={() => updateOrderStatus('cancelled')}
            >
              Cancel Order
            </Button>
          </>
        )}
        {order.order_status === 'processing' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateOrderStatus('completed')}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    </Card>
  );
};

const getStatusColor = (status: Order['order_status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}; 