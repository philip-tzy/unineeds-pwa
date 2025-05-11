import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
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
  console.log(`Setting up order subscription for driver ${driverId}`);
  
  // Create a universal subscription to watch all changes to orders and ride_requests
  const universalChannel = supabase
    .channel('universal_order_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public'
      },
      async (payload) => {
        console.log('Universal database change detected:', payload);
        
        // Check if we need to reload orders based on the change
        const shouldReload = (
          // For orders table
          (payload.table === 'orders' && 
           payload.new?.service_type === 'unimove' && 
           payload.new?.status === 'pending' && 
           !payload.new?.driver_id) || 
          // For ride_requests table
          (payload.table === 'ride_requests' && 
           payload.new?.service_type === 'unimove' && 
           payload.new?.status === 'pending' && 
           !payload.new?.driver_id)
        );
        
        if (shouldReload) {
          console.log('Detected relevant change, reloading pending orders');
          const orders = await fetchPendingOrders(driverId);
          console.log(`Found ${orders.length} pending orders after reload`);
          
          if (orders.length > 0) {
            const newOrderId = payload.new?.id;
            
            // Try to find the specific order that changed
            if (newOrderId) {
              const matchingOrder = orders.find(o => o.id === newOrderId);
              if (matchingOrder) {
                console.log('Found matching order for the detected change:', matchingOrder);
                onNewOrder(matchingOrder);
                return;
              }
            }
            
            // If no specific order found, notify about new pending orders
            const mostRecentOrder = orders.sort((a, b) => 
              new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            )[0];
            
            console.log('Notifying about most recent order:', mostRecentOrder);
            onNewOrder(mostRecentOrder);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Universal subscription status:', status);
    });
  
  // Create a subscription to orders table
  const ordersChannel = supabase
    .channel('new_orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unimove"
      },
      async (payload) => {
        console.log('New order inserted:', payload);
        if (payload.new) {
          // Check if this is a pending order with no driver assigned
          if (payload.new.status === 'pending' && !payload.new.driver_id) {
            // Reload all pending orders to get the latest data, filtering out declined orders
            const orders = await fetchPendingOrders(driverId);
            const newOrder = orders.find(o => o.id === payload.new.id);
            if (newOrder && !newOrder.driver_id) {
              onNewOrder(newOrder);
            }
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Orders subscription status:', status);
    });

  // Create a subscription to ride_requests table
  const ridesChannel = supabase
    .channel('new_ride_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_requests' as any,
      },
      async (payload) => {
        console.log('New ride request inserted:', payload);
        if (payload.new) {
          // Check if this is a pending ride with no driver assigned
          if (payload.new.status === 'pending' && !payload.new.driver_id) {
            // Reload all pending orders to get the latest data, filtering out declined orders
            const orders = await fetchPendingOrders(driverId);
            
            // Try to find the specific new ride request that was just inserted
            const newRideId = payload.new.id;
            if (newRideId) {
              const newOrder = orders.find(o => o.id === newRideId);
              if (newOrder && !newOrder.driver_id) {
                onNewOrder(newOrder);
                return;
              }
            }
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Ride requests subscription status:', status);
    });

  // Return all channels for proper cleanup
  return {
    universalChannel,
    ordersChannel,
    ridesChannel,
    unsubscribe: () => {
      console.log('Unsubscribing from all order update channels');
      supabase.removeChannel(universalChannel);
      supabase.removeChannel(ordersChannel);
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
          const orders = await fetchPendingOrders(driverId);
          const updatedOrder = orders.find(o => o.id === orderId);
          if (updatedOrder) {
            onUpdate(updatedOrder);
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
        table: 'ride_requests' as any,
        filter: `id=eq.${orderId}`
      },
      async (payload) => {
        console.log('Ride request update:', payload);
        if (payload.new) {
          const orders = await fetchPendingOrders(driverId);
          const updatedOrder = orders.find(o => o.id === orderId);
          if (updatedOrder) {
            onUpdate(updatedOrder);
          }
        }
      }
    )
    .subscribe();

  // Return both channels for proper cleanup
  return {
    ordersChannel,
    ridesChannel,
    unsubscribe: () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ridesChannel);
    }
  };
};
