
import { supabase } from '@/integrations/supabase/client';

interface UpdateOrderParams {
  status: string;
  orderType: string;
  orderId: string;
  driverId?: string;
}

/**
 * Updates the status of an order in the database.
 */
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }
};

/**
 * Increments the total rides count for a driver.
 */
export const incrementDriverRides = async (driverId: string) => {
  try {
    // Define the correct parameter type for the RPC function
    interface IncrementDriverRidesParams {
      driver_id: string;
    }
    
    // Fix the generic type parameters for the RPC function call
    const { error } = await supabase.rpc<any, IncrementDriverRidesParams>(
      'increment_driver_rides', 
      { driver_id: driverId }
    );
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error incrementing driver rides:', error);
    return { success: false, error };
  }
};
