
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Order, RideStatus } from '@/types/unimove';
import { fetchPendingOrders, acceptRideOrder } from '@/services/driver/OrderRepository';
import { updateOrderStatus, incrementDriverRides } from '@/services/driver/OrderStatusService';
import { subscribeToNewOrders, subscribeToOrderUpdates } from '@/services/driver/OrderSubscriptionService';

export const useDriverOrders = (userId: string | undefined) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<RideStatus>('searching');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch pending orders and subscribe to new orders
  useEffect(() => {
    if (!userId) return;
    
    const loadPendingOrders = async () => {
      const orders = await fetchPendingOrders();
      setPendingOrders(orders);
    };
    
    loadPendingOrders();
    
    // Subscribe to new order events
    const channel = subscribeToNewOrders((newOrder) => {
      setPendingOrders(current => [...current, newOrder]);
      toast({
        title: "New Ride Request",
        description: "A new ride request is available",
      });
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  // Subscribe to updates on current order
  useEffect(() => {
    if (!currentOrder) return;
    
    const channel = subscribeToOrderUpdates(currentOrder.id, (updatedOrder) => {
      setCurrentOrder(updatedOrder);
      
      if (updatedOrder.status === 'cancelled') {
        toast({
          title: "Ride Cancelled",
          description: "The customer cancelled this ride",
          variant: "destructive",
        });
        setStatus('searching');
        setCurrentOrder(null);
      }
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrder, toast]);

  const acceptRide = async (order: Order) => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      const { error } = await acceptRideOrder(order.id, userId);
      
      if (error) throw error;
      
      setCurrentOrder(order);
      setStatus('accepting');
      
      toast({
        title: "Ride Accepted",
        description: `Picking up customer at ${order.pickup_address}`,
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const declineRide = (order: Order) => {
    setPendingOrders(current => current.filter(o => o.id !== order.id));
    toast({
      title: "Ride declined",
      description: "You've declined this ride request",
    });
  };

  const completePickup = async () => {
    if (!currentOrder || !userId) return;
    
    try {
      const { error } = await updateOrderStatus(currentOrder.id, 'in_progress');
      
      if (error) throw error;
      
      setStatus('ongoing');
      
      toast({
        title: "Customer Picked Up",
        description: `Heading to ${currentOrder.delivery_address}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive",
      });
    }
  };

  const completeRide = async () => {
    if (!currentOrder || !userId) return;
    
    try {
      const { error } = await updateOrderStatus(currentOrder.id, 'completed');
      
      if (error) throw error;
      
      setStatus('completed');
      
      toast({
        title: "Ride Completed",
        description: `You earned $${currentOrder.total_amount.toFixed(2)}`,
      });
      
      await incrementDriverRides(userId);
      
    } catch (error) {
      console.error('Error completing ride:', error);
      toast({
        title: "Error",
        description: "Failed to complete ride",
        variant: "destructive",
      });
    }
  };

  const findNewRide = () => {
    setStatus('searching');
    setCurrentOrder(null);
  };

  return {
    status,
    pendingOrders,
    currentOrder,
    loading,
    acceptRide,
    declineRide,
    completePickup,
    completeRide,
    findNewRide,
  };
};
