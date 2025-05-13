import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/types/unimove';
import { sendNotificationToUser } from '@/services/notification';

// Helper type for database point format
interface DbPoint {
  x: number;
  y: number;
}

// Helper type for database order representation
interface DbOrder extends Omit<Order, 'pickup_coordinates' | 'delivery_coordinates'> {
  pickup_coordinates?: DbPoint | null;
  delivery_coordinates?: DbPoint | null;
}

/**
 * Fetches pending delivery orders for UniSend drivers
 */
export const fetchPendingDeliveryOrders = async (driverId?: string): Promise<Order[]> => {
  console.log(`Fetching pending UniSend delivery orders for driver: ${driverId || 'none'}`);
  
  try {
    // Fetch pending delivery orders from orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('service_type', 'unisend')
      .eq('status', 'pending')
      .is('driver_id', null);
    
    if (ordersError) {
      console.error('Error fetching pending delivery orders:', ordersError);
      
      // If permission error, try an alternative query format with explicit join
      if (ordersError.code === '42501' || ordersError.message?.includes('permission denied')) {
        console.log('Permission error detected, trying alternative query approach...');
        
        // Try a different query approach without joins to users table
        const { data: altOrdersData, error: altError } = await supabase
          .rpc('get_pending_delivery_orders_for_driver', { 
            driver_uuid: driverId || null 
          });
          
        if (altError) {
          console.error('Alternative query also failed:', altError);
          return [];
        }
        
        console.log(`Found ${altOrdersData?.length || 0} pending UniSend orders using alternative approach`);
        return altOrdersData || [];
      }
      
      return [];
    }
    
    console.log(`Found ${ordersData?.length || 0} pending UniSend orders`);
    
    // Convert orders data
    const orders = (ordersData || []).map(order => {
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
    
    // If driver ID is provided, filter out declined orders
    if (driverId) {
      try {
        const declinedOrderIds = await getDeclinedDeliveryOrders(driverId);
        console.log(`Found ${declinedOrderIds.length} declined delivery orders for driver ${driverId}:`, declinedOrderIds);
        
        if (declinedOrderIds.length > 0) {
          const beforeCount = orders.length;
          const filteredOrders = orders.filter(order => !declinedOrderIds.includes(order.id));
          console.log(`Filtered out ${beforeCount - filteredOrders.length} declined delivery orders`);
          return filteredOrders;
        }
      } catch (err) {
        console.error('Error filtering declined delivery orders:', err);
      }
    }
    
    return orders;
  } catch (err) {
    console.error('Unexpected error in fetchPendingDeliveryOrders:', err);
    return [];
  }
};

/**
 * Allows a driver to accept a delivery order
 */
export const acceptDeliveryOrder = async (orderId: string, driverId: string): Promise<{ success: boolean, error: any }> => {
  console.log(`Driver ${driverId} accepting delivery order ${orderId}`);
  
  try {
    // First get customer_id for notification
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching delivery order:', fetchError);
      return { success: false, error: fetchError };
    }
    
    const customerId = orderData?.customer_id;
    
    // Update order status to accepted
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (updateError) {
      console.error('Error accepting delivery order:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('Successfully accepted delivery order');
    
    // Send notification to customer
    if (customerId) {
      try {
        await sendNotificationToUser(
          customerId,
          'Driver Accepted',
          'A driver has accepted your delivery request!',
          'success'
        );
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error accepting delivery order:', err);
    return { success: false, error: err };
  }
};

/**
 * Updates the status of a delivery order
 */
export const updateDeliveryOrderStatus = async (
  orderId: string, 
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled',
  driverId: string
): Promise<{ success: boolean, error: any }> => {
  console.log(`Updating delivery order ${orderId} to status: ${status}`);
  
  try {
    // First get customer_id for notification
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .eq('driver_id', driverId) // Safety check to ensure only the assigned driver can update
      .single();
    
    if (fetchError) {
      console.error('Error fetching delivery order:', fetchError);
      return { success: false, error: fetchError };
    }
    
    const customerId = orderData?.customer_id;
    
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('driver_id', driverId); // Safety check
      
    if (updateError) {
      console.error('Error updating delivery order status:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log(`Successfully updated delivery order status to ${status}`);
    
    // Send notification to customer
    if (customerId) {
      try {
        let title = '';
        let message = '';
        
        switch (status) {
          case 'in_progress':
            title = 'Delivery Started';
            message = 'Your delivery is on the way!';
            break;
          case 'completed':
            title = 'Delivery Complete';
            message = 'Your delivery has been completed successfully!';
            break;
          case 'cancelled':
            title = 'Delivery Cancelled';
            message = 'Your delivery has been cancelled.';
            break;
        }
        
        if (title && message) {
          await sendNotificationToUser(customerId, title, message, status === 'cancelled' ? 'error' : 'success');
        }
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating delivery order status:', err);
    return { success: false, error: err };
  }
};

/**
 * Allows a driver to decline a delivery order
 */
export const saveDeclinedDeliveryOrder = async (orderId: string, driverId: string): Promise<{ success: boolean, error: any }> => {
  try {
    // Save to local storage first (for immediate effect)
    const storageKey = `declined_delivery_orders_${driverId}`;
    const existingDeclined = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (!existingDeclined.includes(orderId)) {
      existingDeclined.push(orderId);
      localStorage.setItem(storageKey, JSON.stringify(existingDeclined));
    }
    
    // Also save to database for persistence across devices
    const { error } = await supabase
      .from('driver_declined_orders')
      .insert({
        driver_id: driverId,
        order_id: orderId,
        order_type: 'unisend',
        declined_at: new Date().toISOString()
      })
      .single();
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error saving declined delivery order:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in saveDeclinedDeliveryOrder:', err);
    return { success: false, error: err };
  }
};

/**
 * Gets all declined delivery order IDs for a driver
 */
export const getDeclinedDeliveryOrders = async (driverId: string): Promise<string[]> => {
  try {
    // Get locally stored declined orders first (for immediate access)
    const storageKey = `declined_delivery_orders_${driverId}`;
    const localDeclinedOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Also get from database for persistence
    const { data, error } = await supabase
      .from('driver_declined_orders')
      .select('order_id')
      .eq('driver_id', driverId)
      .eq('order_type', 'unisend');
    
    if (error) {
      console.error('Error fetching declined delivery orders:', error);
      return localDeclinedOrders;
    }
    
    // Combine local and database results
    const dbDeclinedOrders = data?.map(item => item.order_id) || [];
    const combinedDeclinedOrders = Array.from(new Set([...localDeclinedOrders, ...dbDeclinedOrders]));
    
    return combinedDeclinedOrders;
  } catch (err) {
    console.error('Error in getDeclinedDeliveryOrders:', err);
    return [];
  }
}; 