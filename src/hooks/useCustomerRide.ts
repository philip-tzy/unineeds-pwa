import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Order, RideStatus } from '@/types/unimove';
import {
  createRideRequest,
  cancelRideRequest,
  createRideTransaction
} from '@/services/unimove/api';

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
  const convertDbOrderToOrder = (dbOrder: any): Order => {
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
    if (!userId) return;

    // Get the customer's active order
    const fetchActiveOrder = async () => {
      try {
        // First check for active orders in the orders table
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            driver:driver_id (id, name, rating, total_rides)
          `)
          .eq('customer_id', userId)
          .eq('service_type', 'unimove')
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Fetched active order:', orderData);

        // Then check for active ride requests
        const { data: rideData, error: rideError } = await supabase
          .from('ride_requests')
          .select(`
            *,
            driver:driver_id (id, name, rating, total_rides)
          `)
          .eq('customer_id', userId)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Fetched active ride request:', rideData);

        // If we have an active ride request, use that
        if (rideData && !rideError) {
          // Convert ride_request to Order format
          const activeRide = {
            id: rideData.id,
            customer_id: rideData.customer_id,
            driver_id: rideData.driver_id,
            driver: rideData.driver,
            pickup_address: rideData.pickup_location,
            delivery_address: rideData.dropoff_location,
            pickup_coordinates: null,
            delivery_coordinates: null,
            status: rideData.status,
            service_type: 'unimove',
            total_amount: rideData.price || 0,
            created_at: rideData.created_at,
            updated_at: rideData.updated_at
          } as Order;
          
          setOrder(activeRide);
          
          // Update status based on ride status
          if (activeRide.status === 'pending') {
            setStatus('searching');
          } else if (activeRide.status === 'accepted') {
            setStatus('accepting');
          } else if (activeRide.status === 'in_progress') {
            setStatus('ongoing');
          } else if (activeRide.status === 'completed') {
            setStatus('completed');
          }
          
          return; // Exit early as we found an active ride request
        }
        
        // If no active ride request, use order data if available
        if (orderData && !orderError) {
          // Convert to Order type
          const activeOrder = convertDbOrderToOrder(orderData);
          setOrder(activeOrder);

          // Update status based on order status
          if (activeOrder.status === 'pending') {
            setStatus('searching');
          } else if (activeOrder.status === 'accepted') {
            setStatus('accepting');
          } else if (activeOrder.status === 'in_progress') {
            setStatus('ongoing');
          } else if (activeOrder.status === 'completed') {
            setStatus('completed');
          }
          
          return; // Exit early as we found an active order
        }

        // If no active order or ride request found
        if ((orderError && orderError.code === 'PGRST116') || 
            (rideError && rideError.code === 'PGRST116')) {
          setOrder(null);
          setStatus('searching');
        } else if (orderError && !orderError.message.includes('Results contain 0 rows')) {
          throw orderError;
        } else if (rideError && !rideError.message.includes('Results contain 0 rows')) {
          throw rideError;
        }
      } catch (error) {
        console.error('Error fetching active order or ride:', error);
      }
    };

    fetchActiveOrder();

    // Subscribe to changes on the orders table for this customer
    const ordersSubscription = supabase
      .channel('orders_for_customer')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `customer_id=eq.${userId}` 
        },
        (payload) => {
          console.log('Orders change detected:', payload);
          fetchActiveOrder();
          
          // Show notifications for status changes
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              if (newStatus === 'accepted') {
                toast({
                  title: "Driver Accepted",
                  description: "A driver has accepted your ride request!",
                });
              } else if (newStatus === 'in_progress') {
                toast({
                  title: "Ride Started",
                  description: "Your ride has started. You're on the way!",
                });
              } else if (newStatus === 'completed') {
                toast({
                  title: "Ride Completed",
                  description: "Your ride has been completed. Thank you!",
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Subscribe to changes on the ride_requests table for this customer
    const ridesSubscription = supabase
      .channel('rides_for_customer')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ride_requests',
          filter: `customer_id=eq.${userId}` 
        },
        (payload) => {
          console.log('Ride request change detected:', payload);
          fetchActiveOrder();
          
          // Show notifications for status changes
          if (payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              if (newStatus === 'accepted') {
                toast({
                  title: "Driver Accepted",
                  description: "A driver has accepted your ride request!",
                });
              } else if (newStatus === 'in_progress') {
                toast({
                  title: "Ride Started",
                  description: "Your ride has started. You're on the way!",
                });
              } else if (newStatus === 'completed') {
                toast({
                  title: "Ride Completed",
                  description: "Your ride has been completed. Thank you!",
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      ridesSubscription.unsubscribe();
    };
  }, [userId, toast]);

  // Create a new ride request
  const requestRide = async (
    pickup: string, 
    destination: string, 
    pickupCoords: [number, number],
    destinationCoords: [number, number],
    price: number = 5.99
  ) => {
    if (!userId) return;

    setLoading(true);

    try {
      // Ensure coordinates are valid
      if (!Array.isArray(pickupCoords) || pickupCoords.length !== 2 || 
          !Array.isArray(destinationCoords) || destinationCoords.length !== 2) {
        throw new Error("Invalid coordinates format");
      }

      const newOrder = await createRideRequest(
        userId,
        pickup,
        destination,
        pickupCoords,
        destinationCoords,
        price
      );

      // Handle order creation success
      toast({
        title: "Ride Requested",
        description: "Searching for drivers...",
      });

      // Update local state
      setOrder(newOrder);
      setStatus('searching');
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
      await cancelRideRequest(order.id, userId);

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

  // Pay for the ride
  const payForRide = async (paymentMethod: string) => {
    if (!userId || !order || !order.driver_id) return;

    try {
      await createRideTransaction(
        order.id,
        userId,
        order.driver_id,
        order.total_amount,
        paymentMethod
      );

      toast({
        title: "Payment Processed",
        description: "Your payment has been processed successfully",
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    order,
    status,
    loading,
    requestRide,
    cancelRide,
    payForRide
  };
};
