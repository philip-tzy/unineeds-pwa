
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Order } from '@/types/unimove';

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

export const subscribeToNewOrders = (
  onNewOrder: (order: Order) => void
): RealtimeChannel => {
  return supabase
    .channel('new-unimove-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: "service_type=eq.unimove"
      },
      (payload) => {
        const newDbOrder = payload.new as DbOrder;
        if (newDbOrder.status === 'pending' && !newDbOrder.driver_id) {
          // Convert database point type to tuple
          const orderWithCoordinates = convertDbOrderToOrder(newDbOrder);
          onNewOrder(orderWithCoordinates);
        }
      }
    )
    .subscribe();
};

export const subscribeToOrderUpdates = (
  orderId: string,
  onOrderUpdate: (order: Order) => void
): RealtimeChannel => {
  return supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        const updatedDbOrder = payload.new as DbOrder;
        
        // Convert database point type to tuple
        const orderWithCoordinates = convertDbOrderToOrder(updatedDbOrder);
        onOrderUpdate(orderWithCoordinates);
      }
    )
    .subscribe();
};
