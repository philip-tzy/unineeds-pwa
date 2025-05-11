import { supabase } from '@/integrations/supabase/client';
import { sendNotificationToUser } from '@/services/notification';

interface UpdateOrderParams {
  status: string;
  orderType: string;
  orderId: string;
  driverId?: string;
}

/**
 * Updates the status of an order in the database.
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<{ error: any }> => {
  let error = null;
  let customerId = null;
  let driverId = null;
  
  try {
    // Try to update in orders table first
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('customer_id, driver_id')
      .eq('id', orderId)
      .single();
      
    if (!fetchError && orderData) {
      customerId = orderData.customer_id;
      driverId = orderData.driver_id;
    }
    
    const { error: ordersError } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (!ordersError) {
      console.log(`Successfully updated order status to ${status} in orders table`);
      
      // If this is a status change to 'in_progress', notify the customer
      if (status === 'in_progress' && customerId) {
        try {
          await sendNotificationToUser(
            customerId,
            'Ride Started',
            'Your driver has started the trip. You are on your way!',
            'success'
          );
        } catch (notifyError) {
          console.error('Error sending customer notification:', notifyError);
        }
      }
      
      return { error: null };
    }
    
    // If not found in orders, try ride_requests table
    const { data: rideData, error: rideFetchError } = await supabase
      .from('ride_requests' as any)
      .select('customer_id, driver_id')
      .eq('id', orderId)
      .single();
      
    if (!rideFetchError && rideData) {
      customerId = (rideData as any).customer_id;
      driverId = (rideData as any).driver_id;
    }
    
    const { error: ridesError } = await supabase
      .from('ride_requests' as any)
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (!ridesError) {
      console.log(`Successfully updated order status to ${status} in ride_requests table`);
      
      // If this is a status change to 'in_progress', notify the customer
      if (status === 'in_progress' && customerId) {
        try {
          await sendNotificationToUser(
            customerId,
            'Ride Started',
            'Your driver has started the trip. You are on your way!',
            'success'
          );
        } catch (notifyError) {
          console.error('Error sending customer notification:', notifyError);
        }
      }
      
      return { error: null };
    }
    
    error = ridesError;
  } catch (err) {
    console.error('Error updating order status:', err);
    error = err;
  }
  
  return { error };
};

/**
 * Increments the total rides count for a driver.
 */
export const incrementDriverRides = async (driverId: string): Promise<{ error: any }> => {
  try {
    // Get current ride count
    const { data, error: fetchError } = await supabase
      .from('drivers')
      .select('total_rides')
      .eq('id', driverId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching driver data:', fetchError);
      return { error: fetchError };
    }
    
    const currentRides = data?.total_rides || 0;
    
    // Update the total_rides count
    const { error: updateError } = await supabase
      .from('drivers')
      .update({ 
        total_rides: currentRides + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);
    
    if (updateError) {
      console.error('Error updating total rides:', updateError);
      return { error: updateError };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Error incrementing driver rides:', err);
    return { error: err };
  }
};
