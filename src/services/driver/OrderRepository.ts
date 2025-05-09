
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/types/unimove';

// Helper type to handle database point format
interface DbPoint {
  x: number;
  y: number;
}

// Helper type for database order representation
interface DbOrder extends Omit<Order, 'pickup_coordinates' | 'delivery_coordinates'> {
  pickup_coordinates?: DbPoint | null;
  delivery_coordinates?: DbPoint | null;
}

export const fetchPendingOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('service_type', 'unimove')
    .eq('status', 'pending')
    .is('driver_id', null);
  
  if (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }
  
  // Convert database point type to tuple
  return (data || []).map(order => {
    const dbOrder = order as DbOrder;
    return {
      ...dbOrder,
      pickup_coordinates: dbOrder.pickup_coordinates 
        ? [dbOrder.pickup_coordinates.x, dbOrder.pickup_coordinates.y] as [number, number]
        : null,
      delivery_coordinates: dbOrder.delivery_coordinates 
        ? [dbOrder.delivery_coordinates.x, dbOrder.delivery_coordinates.y] as [number, number]
        : null
    };
  });
};

export const acceptRideOrder = async (orderId: string, driverId: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('orders')
    .update({ 
      driver_id: driverId,
      status: 'accepted' 
    })
    .eq('id', orderId);
  
  return { error };
};
