import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    setupRealtimeSubscription();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((current) => [newOrder, ...current]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="p-4">
          <div className="flex justify-between items-start">
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
          
          <div className="mt-2">
            <p className="text-sm">
              Quantity: {order.quantity}
            </p>
            <p className="text-sm font-medium">
              Total: ${order.total_price.toFixed(2)}
            </p>
          </div>
        </Card>
      ))}
      
      {orders.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No orders found
        </div>
      )}
    </div>
  );
}; 