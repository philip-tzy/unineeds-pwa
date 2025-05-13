import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Order } from '@/types/unimove';
import { fetchPendingOrders } from './OrderRepository';

interface DbPoint {
  x: number;
  y: number;
}

interface DbOrder extends Omit<Order, 'pickup_coordinates' | 'delivery_coordinates'> {
  pickup_coordinates?: DbPoint | null;
  delivery_coordinates?: DbPoint | null;
}

// Interface for ride request payload
interface RideRequestPayload {
  id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  service_type: string;
  price: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

// Helper function to convert DB order to Order type
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

// Subscribe to new orders being created in the system
export const subscribeToNewOrders = (onNewOrder: (order: Order) => void, driverId?: string) => {
  console.log(`Setting up order subscription for driver ${driverId || 'none'}`);
  
  // Subscribe directly to INSERT events on orders table for UniMove service
  const ordersChannel = supabase
    .channel('unimove_orders_inserts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unimove"
      },
      async (payload) => {
        console.log('New UniMove order inserted:', payload);
        
        if (payload.new && payload.new.status === 'pending' && !payload.new.driver_id) {
          try {
            // Get the full order data
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('id', payload.new.id)
              .single();
              
            if (error) throw error;
            
            if (data) {
              console.log('Processing new order:', data);
              const order = convertDbOrderToOrder(data as DbOrder);
              onNewOrder(order);
            }
          } catch (error) {
            console.error('Error processing new order notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Orders subscription status:', status);
    });
  
  // Subscribe to status changes on orders (for updates to pending orders)
  const ordersUpdateChannel = supabase
    .channel('unimove_orders_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unimove"
      },
      async (payload) => {
        console.log('UniMove order updated:', payload);
        
        // If an order was updated to pending status
        if (payload.new && 
            payload.new.status === 'pending' && 
            !payload.new.driver_id && 
            payload.old?.status !== 'pending') {
          
          try {
            // Get the full order data
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('id', payload.new.id)
              .single();
              
            if (error) throw error;
            
            if (data) {
              console.log('Processing updated order that became pending:', data);
              const order = convertDbOrderToOrder(data as DbOrder);
              onNewOrder(order);
            }
          } catch (error) {
            console.error('Error processing updated order notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Orders updates subscription status:', status);
    });
  
  // Subscribe to INSERT events on ride_requests table
  const ridesChannel = supabase
    .channel('unimove_ride_requests_inserts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_requests',
      },
      async (payload) => {
        console.log('New ride request inserted:', payload);
        
        if (payload.new) {
          try {
            // Type assertion for the payload
            const rideRequest = payload.new as RideRequestPayload;
            
            // Only process pending rides with no driver assigned
            if (rideRequest.status === 'pending' && !rideRequest.driver_id) {
              // Map ride_request to Order format
              const rideOrder: Order = {
                id: rideRequest.id,
                customer_id: rideRequest.customer_id,
                driver_id: null,
                pickup_address: rideRequest.pickup_location,
                delivery_address: rideRequest.dropoff_location,
                pickup_coordinates: null,
                delivery_coordinates: null,
                status: rideRequest.status,
                service_type: rideRequest.service_type || 'unimove',
                total_amount: rideRequest.price || 0,
                created_at: rideRequest.created_at,
                updated_at: rideRequest.updated_at
              };
              
              console.log('Processing new ride request:', rideOrder);
              onNewOrder(rideOrder);
            }
          } catch (error) {
            console.error('Error processing new ride request notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Ride requests subscription status:', status);
    });
  
  // Create periodic polling as a fallback mechanism
  const pollingInterval = setInterval(async () => {
    console.log('Polling for new pending orders...');
    try {
      const pendingOrders = await fetchPendingOrders(driverId);
      console.log(`Poll found ${pendingOrders.length} pending orders`);
      
      // Process any new orders found during polling
      // We'll only notify about the most recent pending order to avoid spamming
      if (pendingOrders.length > 0) {
        const mostRecent = pendingOrders.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0];
        
        // Store processed order IDs in local storage to avoid duplicate notifications
        const processedKey = `processed_orders_${driverId || 'anonymous'}`;
        const processedOrders = JSON.parse(localStorage.getItem(processedKey) || '[]');
        
        if (!processedOrders.includes(mostRecent.id)) {
          console.log('Found unprocessed pending order during polling:', mostRecent);
          onNewOrder(mostRecent);
          
          // Update processed orders list
          processedOrders.push(mostRecent.id);
          localStorage.setItem(processedKey, JSON.stringify(processedOrders));
        }
      }
    } catch (error) {
      console.error('Error during order polling:', error);
    }
  }, 60000); // Poll every minute as a fallback

  // Return all channels for proper cleanup
  return {
    unsubscribe: () => {
      console.log('Unsubscribing from all order update channels');
      clearInterval(pollingInterval);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ordersUpdateChannel);
      supabase.removeChannel(ridesChannel);
    }
  };
};

// Subscribe to updates on a specific order
export const subscribeToOrderUpdates = (orderId: string, onUpdate: (order: Order) => void, driverId?: string) => {
  // Subscribe to changes on the orders table for this specific order
  const ordersChannel = supabase
    .channel(`order_updates_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      async (payload) => {
        console.log('Order update:', payload);
        if (payload.new) {
          try {
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single();
              
            if (error) throw error;
            
            if (data) {
              const order = convertDbOrderToOrder(data as DbOrder);
              onUpdate(order);
            }
          } catch (error) {
            console.error('Error processing order update:', error);
          }
        }
      }
    )
    .subscribe();

  // Subscribe to changes on the ride_requests table for this specific order
  const ridesChannel = supabase
    .channel(`ride_request_updates_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ride_requests',
        filter: `id=eq.${orderId}`
      },
      async (payload) => {
        console.log('Ride request update:', payload);
        if (payload.new) {
          try {
            // Type assertion for the payload
            const rideRequest = payload.new as RideRequestPayload;
            
            // Map ride_request to Order format
            const rideOrder: Order = {
              id: rideRequest.id,
              customer_id: rideRequest.customer_id,
              driver_id: rideRequest.driver_id,
              pickup_address: rideRequest.pickup_location,
              delivery_address: rideRequest.dropoff_location,
              pickup_coordinates: null,
              delivery_coordinates: null,
              status: rideRequest.status,
              service_type: rideRequest.service_type || 'unimove',
              total_amount: rideRequest.price || 0,
              created_at: rideRequest.created_at,
              updated_at: rideRequest.updated_at
            };
            
            onUpdate(rideOrder);
          } catch (error) {
            console.error('Error processing ride request update:', error);
          }
        }
      }
    )
    .subscribe();

  // Return both channels for proper cleanup
  return {
    unsubscribe: () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ridesChannel);
    }
  };
};
