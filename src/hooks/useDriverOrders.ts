import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Order, RideStatus } from '@/types/unimove';
import { fetchPendingOrders, acceptRideOrder } from '@/services/driver/OrderRepository';
import { updateOrderStatus, incrementDriverRides } from '@/services/driver/OrderStatusService';
import { subscribeToNewOrders, subscribeToOrderUpdates } from '@/services/driver/OrderSubscriptionService';
import { 
  fetchPendingDeliveryOrders, 
  acceptDeliveryOrder, 
  updateDeliveryOrderStatus 
} from '@/services/driver/UniSendOrderRepository';
import { 
  subscribeToNewDeliveryOrders, 
  subscribeToDeliveryOrderUpdates 
} from '@/services/driver/UniSendSubscriptionService';

export const useDriverOrders = (userId: string | undefined) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<RideStatus>('searching');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch pending orders and subscribe to new orders
  useEffect(() => {
    if (!userId) return;
    
    console.log(`Initializing driver orders hook for driver ${userId}`);
    
    const loadPendingOrders = async () => {
      try {
        // Fetch both ride and delivery orders
        const rideOrders = await fetchPendingOrders(userId);
        const deliveryOrders = await fetchPendingDeliveryOrders(userId);
        
        // Combine the orders, marking their type through the service_type property
        const allOrders = [
          ...rideOrders,
          ...deliveryOrders
        ];
        
        setPendingOrders(allOrders);
        
        // Log results for debugging
        console.log(`Loaded ${rideOrders.length} ride orders and ${deliveryOrders.length} delivery orders`);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };
    
    // Load initial pending orders
    loadPendingOrders();
    
    // Set up polling to check for new orders every 30 seconds as a fallback
    const pollingInterval = setInterval(() => {
      console.log('Polling for new orders...');
      loadPendingOrders();
    }, 30000);
    
    // Subscribe to new ride orders
    const rideSubscription = subscribeToNewOrders((newOrder) => {
      console.log('New ride order received:', newOrder);
      
      // Check if the driver is eligible for this order
      if (newOrder.driver_id === null || newOrder.driver_id === userId) {
        setPendingOrders(current => {
          // Check if the order is already in the list
          if (current.some(o => o.id === newOrder.id)) {
            return current;
          }
          return [newOrder, ...current];
        });
        
        toast({
          title: "New Ride Request",
          description: `New ride from ${newOrder.pickup_address || 'pickup'} to ${newOrder.delivery_address || 'destination'}`,
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      }
    });
    
    // Subscribe to new delivery orders
    const deliverySubscription = subscribeToNewDeliveryOrders((newDeliveryOrder) => {
      console.log('New delivery order received:', newDeliveryOrder);
      
      // Check if the driver is eligible for this order
      if (newDeliveryOrder.driver_id === null || newDeliveryOrder.driver_id === userId) {
        setPendingOrders(current => {
          // Check if the order is already in the list
          if (current.some(o => o.id === newDeliveryOrder.id)) {
            return current;
          }
          return [newDeliveryOrder, ...current];
        });
        
        toast({
          title: "New Delivery Request",
          description: `New delivery from ${newDeliveryOrder.pickup_address || 'pickup'} to ${newDeliveryOrder.delivery_address || 'destination'}`,
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      }
    });
    
    return () => {
      clearInterval(pollingInterval);
      if (rideSubscription && rideSubscription.unsubscribe) {
        console.log('Unsubscribing from ride order updates');
        rideSubscription.unsubscribe();
      }
      if (deliverySubscription && deliverySubscription.unsubscribe) {
        console.log('Unsubscribing from delivery order updates');
        deliverySubscription.unsubscribe();
      }
    };
  }, [userId, toast]);

  // Subscribe to updates on current order
  useEffect(() => {
    if (!currentOrder) return;
    
    let subscription: { unsubscribe: () => void };
    
    // Choose the right subscription based on service type
    if (currentOrder.service_type === 'unisend') {
      subscription = subscribeToDeliveryOrderUpdates(currentOrder.id, (updatedOrder) => {
        setCurrentOrder(updatedOrder);
        
        if (updatedOrder.status === 'cancelled') {
          toast({
            title: "Delivery Cancelled",
            description: "The customer cancelled this delivery",
            variant: "destructive",
          });
          setStatus('searching');
          setCurrentOrder(null);
        }
      });
    } else {
      subscription = subscribeToOrderUpdates(currentOrder.id, (updatedOrder) => {
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
    }
    
    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrder, toast, userId]);

  const acceptRide = async (order: Order) => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      console.log(`Driver ${userId} accepting order ${order.id} of type ${order.service_type}`);
      
      let success = false;
      let error = null;
      
      // Different function calls based on service type
      if (order.service_type === 'unisend') {
        // Handle delivery order acceptance
        const result = await acceptDeliveryOrder(order.id, userId);
        success = result.success;
        error = result.error;
      } else {
        // Handle ride order acceptance
        const result = await acceptRideOrder(order.id, userId);
        error = result.error;
        success = !error;
      }
      
      if (error) throw error;
      
      // Immediately update the local state without waiting for subscription
      setCurrentOrder({
        ...order,
        driver_id: userId,
        status: 'accepted'
      });
      setStatus('accepting');
      
      // Remove this order from pending orders list
      setPendingOrders(current => current.filter(o => o.id !== order.id));
      
      let serviceLabel = order.service_type === 'unisend' ? 'Delivery' : 'Ride';
      
      toast({
        title: `${serviceLabel} Accepted`,
        description: `Picking up at ${order.pickup_address}`,
      });
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const declineRide = (order: Order) => {
    setPendingOrders(current => current.filter(o => o.id !== order.id));
    const serviceLabel = order.service_type === 'unisend' ? 'Delivery' : 'Ride';
    toast({
      title: `${serviceLabel} declined`,
      description: `You've declined this ${serviceLabel.toLowerCase()} request`,
    });
  };

  const completePickup = async () => {
    if (!currentOrder || !userId) return;
    
    try {
      let error = null;
      
      if (currentOrder.service_type === 'unisend') {
        const result = await updateDeliveryOrderStatus(currentOrder.id, 'in_progress', userId);
        error = result.error;
      } else {
        const result = await updateOrderStatus(currentOrder.id, 'in_progress');
        error = result.error;
      }
      
      if (error) throw error;
      
      setStatus('ongoing');
      
      const serviceLabel = currentOrder.service_type === 'unisend' ? 'Package' : 'Customer';
      
      toast({
        title: `${serviceLabel} Picked Up`,
        description: `Heading to ${currentOrder.delivery_address}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const completeRide = async () => {
    if (!currentOrder || !userId) return;
    
    try {
      let error = null;
      
      if (currentOrder.service_type === 'unisend') {
        const result = await updateDeliveryOrderStatus(currentOrder.id, 'completed', userId);
        error = result.error;
      } else {
        const result = await updateOrderStatus(currentOrder.id, 'completed');
        error = result.error;
      }
      
      if (error) throw error;
      
      setStatus('completed');
      
      const serviceLabel = currentOrder.service_type === 'unisend' ? 'Delivery' : 'Ride';
      
      toast({
        title: `${serviceLabel} Completed`,
        description: `You earned $${currentOrder.total_amount.toFixed(2)}`,
      });
      
      if (currentOrder.service_type !== 'unisend') {
        await incrementDriverRides(userId);
      }
      
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Failed to complete order",
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
