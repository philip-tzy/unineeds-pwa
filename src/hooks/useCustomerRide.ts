
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Order, RideStatus } from '@/types/unimove';

interface DbPoint {
  x: number;
  y: number;
}

interface DbOrder extends Omit<Order, 'pickup_coordinates' | 'delivery_coordinates'> {
  pickup_coordinates?: { x: number; y: number } | null;
  delivery_coordinates?: { x: number; y: number } | null;
}

export const useCustomerRide = (userId: string | undefined) => {
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<RideStatus>('searching');
  const [loading, setLoading] = useState(false);

  // Convert database point type to tuple
  const convertDbOrderToOrder = (dbOrder: DbOrder): Order => {
    return {
      ...dbOrder,
      pickup_coordinates: dbOrder.pickup_coordinates 
        ? [dbOrder.pickup_coordinates.x, dbOrder.pickup_coordinates.y] as [number, number]
        : null,
      delivery_coordinates: dbOrder.delivery_coordinates 
        ? [dbOrder.delivery_coordinates.x, dbOrder.delivery_coordinates.y] as [number, number]
        : null
    };
  };

  // Listen for updates to the customer's order
  useEffect(() => {
    if (!userId || !order) return;

    const channel = supabase
      .channel(`order-updates-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updatedDbOrder = payload.new as DbOrder;
          const updatedOrder = convertDbOrderToOrder(updatedDbOrder);
          
          setOrder(updatedOrder);

          if (updatedDbOrder.status === 'accepted') {
            setStatus('accepting');
            toast({
              title: "Driver Found!",
              description: "A driver has accepted your ride request",
            });
          } else if (updatedDbOrder.status === 'in_progress') {
            setStatus('ongoing');
            toast({
              title: "Ride Started",
              description: "Your ride is now in progress",
            });
          } else if (updatedDbOrder.status === 'completed') {
            setStatus('completed');
            toast({
              title: "Ride Completed",
              description: "Hope you enjoyed your ride!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, order, toast]);

  // Create a new ride request
  const requestRide = async (pickup: string, destination: string, price: number = 5.99) => {
    if (!userId) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: userId,
          pickup_address: pickup,
          delivery_address: destination,
          status: 'pending',
          service_type: 'unimove',
          total_amount: price
        })
        .select()
        .single();

      if (error) throw error;

      // Handle order creation success
      toast({
        title: "Ride Requested",
        description: "Searching for drivers...",
      });

      // Update local state with converted order
      const newOrder = convertDbOrderToOrder(data as DbOrder);
      setOrder(newOrder);
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast({
        title: "Error",
        description: "Failed to request ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel the current ride
  const cancelRide = async () => {
    if (!userId || !order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('customer_id', userId);

      if (error) throw error;

      toast({
        title: "Ride Cancelled",
        description: "Your ride request has been cancelled",
      });

      setOrder(null);
      setStatus('searching');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    order,
    status,
    loading,
    requestRide,
    cancelRide
  };
};
