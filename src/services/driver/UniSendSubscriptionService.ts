import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Order } from '@/types/unimove';
import { fetchPendingDeliveryOrders } from './UniSendOrderRepository';

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

/**
 * Subscribes to new delivery orders in the system
 * @param onNewOrder Callback function that will be called when a new order is detected
 * @param driverId Optional driver ID to filter orders
 * @returns Subscription object with methods to unsubscribe
 */
export const subscribeToNewDeliveryOrders = (onNewOrder: (order: Order) => void, driverId?: string) => {
  console.log(`Setting up UniSend delivery order subscription for driver ${driverId || 'none'}`);
  
  // Create a subscription for INSERT events on UniSend orders
  const insertChannel = supabase
    .channel('unisend_delivery_orders_inserts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unisend"
      },
      async (payload) => {
        console.log('New UniSend order inserted:', payload);
        
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
              console.log('Processing new UniSend order:', data);
              const order = convertDbOrderToOrder(data as DbOrder);
              onNewOrder(order);
            }
          } catch (error) {
            console.error('Error processing new UniSend order notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('UniSend delivery insert subscription status:', status);
    });
  
  // Create a subscription for UPDATE events on UniSend orders
  const updateChannel = supabase
    .channel('unisend_delivery_orders_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unisend"
      },
      async (payload) => {
        console.log('UniSend order updated:', payload);
        
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
              console.log('Processing updated UniSend order that became pending:', data);
              const order = convertDbOrderToOrder(data as DbOrder);
              onNewOrder(order);
            }
          } catch (error) {
            console.error('Error processing updated UniSend order notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('UniSend delivery update subscription status:', status);
    });
  
  // Create periodic polling as a fallback mechanism
  const pollingInterval = setInterval(async () => {
    console.log('Polling for new pending UniSend delivery orders...');
    try {
      const pendingOrders = await fetchPendingDeliveryOrders(driverId);
      console.log(`Poll found ${pendingOrders.length} pending UniSend delivery orders`);
      
      // Process any new orders found during polling
      // We'll only notify about the most recent pending order to avoid spamming
      if (pendingOrders.length > 0) {
        const mostRecent = pendingOrders.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0];
        
        // Store processed order IDs in local storage to avoid duplicate notifications
        const processedKey = `processed_unisend_orders_${driverId || 'anonymous'}`;
        const processedOrders = JSON.parse(localStorage.getItem(processedKey) || '[]');
        
        if (!processedOrders.includes(mostRecent.id)) {
          console.log('Found unprocessed pending UniSend delivery order during polling:', mostRecent);
          onNewOrder(mostRecent);
          
          // Update processed orders list
          processedOrders.push(mostRecent.id);
          localStorage.setItem(processedKey, JSON.stringify(processedOrders));
        }
      }
    } catch (error) {
      console.error('Error during UniSend order polling:', error);
    }
  }, 60000); // Poll every minute as a fallback
  
  // Return the channels to allow unsubscribing
  return {
    unsubscribe: () => {
      console.log('Unsubscribing from UniSend delivery order updates');
      clearInterval(pollingInterval);
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(updateChannel);
    }
  };
};

/**
 * Subscribes to updates on a specific delivery order
 * @param orderId The ID of the order to subscribe to
 * @param onUpdate Callback function that will be called when the order is updated
 * @returns Subscription object with methods to unsubscribe
 */
export const subscribeToDeliveryOrderUpdates = (
  orderId: string, 
  onUpdate: (order: Order) => void
) => {
  // Subscribe to changes on this specific order
  const orderChannel = supabase
    .channel(`unisend_order_updates_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      async (payload) => {
        console.log('UniSend delivery order update:', payload);
        if (payload.new) {
          try {
            // Get the full order data
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single();
              
            if (error) throw error;
            
            if (data) {
              console.log('Processing updated UniSend order:', data);
              const order = convertDbOrderToOrder(data as DbOrder);
              onUpdate(order);
            }
          } catch (error) {
            console.error('Error processing UniSend order update notification:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log(`UniSend delivery order ${orderId} subscription status:`, status);
    });
  
  // Return the channel to allow unsubscribing
  return {
    unsubscribe: () => {
      console.log(`Unsubscribing from UniSend delivery order ${orderId} updates`);
      supabase.removeChannel(orderChannel);
    }
  };
}; 