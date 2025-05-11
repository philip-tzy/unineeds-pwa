import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/types/unimove';
import { sendNotificationToUser } from '@/services/notification';

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

export const fetchPendingOrders = async (driverId?: string): Promise<Order[]> => {
  console.log(`Fetching pending orders for driver: ${driverId || 'none'}`);
  
  // First fetch from orders table
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('service_type', 'unimove')
    .eq('status', 'pending')
    .is('driver_id', null);
  
  if (ordersError) {
    console.error('Error fetching pending orders from orders table:', ordersError);
  } else {
    console.log(`Found ${ordersData?.length || 0} pending orders in 'orders' table`);
  }
  
  // Also fetch from ride_requests table
  const { data: ridesData, error: ridesError } = await supabase
    .from('ride_requests')
    .select(`
      id,
      customer_id,
      driver_id,
      pickup_location as pickup_address,
      dropoff_location as delivery_address,
      price as total_amount,
      status,
      service_type,
      created_at,
      updated_at
    `)
    .eq('service_type', 'unimove')
    .eq('status', 'pending')
    .is('driver_id', null);
  
  if (ridesError) {
    console.error('Error fetching pending rides from ride_requests table:', ridesError);
  } else {
    console.log(`Found ${ridesData?.length || 0} pending rides in 'ride_requests' table`);
  }
  
  // Convert ride_requests data to Order format
  const rideOrders = (ridesData || []).map(ride => {
    return {
      id: ride.id,
      customer_id: ride.customer_id,
      driver_id: null,
      pickup_address: ride.pickup_address,
      delivery_address: ride.delivery_address,
      pickup_coordinates: null, // Coordinates not available
      delivery_coordinates: null, // Coordinates not available
      status: ride.status,
      service_type: ride.service_type || 'unimove', // Default to unimove if not specified
      total_amount: ride.total_amount || 0,
      created_at: ride.created_at,
      updated_at: ride.updated_at
    } as Order;
  });
  
  // Convert regular orders data
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
  
  // Combine both results
  let combinedOrders = [...orders, ...rideOrders];
  console.log(`Total combined pending orders before filtering: ${combinedOrders.length}`);
  
  // If driver ID is provided, filter out declined orders
  if (driverId) {
    try {
      const declinedOrderIds = await getDeclinedOrders(driverId);
      console.log(`Found ${declinedOrderIds.length} declined orders for driver ${driverId}:`, declinedOrderIds);
      
      if (declinedOrderIds.length > 0) {
        const beforeCount = combinedOrders.length;
        combinedOrders = combinedOrders.filter(order => !declinedOrderIds.includes(order.id));
        console.log(`Filtered out ${beforeCount - combinedOrders.length} declined orders`);
      }
    } catch (err) {
      console.error('Error filtering declined orders:', err);
    }
  }
  
  console.log(`Returning ${combinedOrders.length} pending orders after all filtering`);
  return combinedOrders;
};

export const acceptRideOrder = async (orderId: string, driverId: string): Promise<{ error: any }> => {
  let error = null;
  
  console.log(`Driver ${driverId} accepting order ${orderId}`);
  
  // Try to update in orders table first
  try {
    // First get customer_id for notification
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .single();
    
    let customerId = orderData?.customer_id;
    
    // Update order in the orders table
    const { error: ordersError } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (!ordersError) {
      console.log('Successfully accepted ride in orders table');
      
      // Send notification to customer if we have their ID
      if (customerId) {
        try {
          await sendNotificationToUser(
            customerId,
            'Driver Accepted',
            'A driver has accepted your ride request!',
            'success'
          );
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      return { error: null };
    }
    
    // If not found in orders, try checking ride_requests first
    if (!customerId) {
      const { data: rideData, error: rideFetchError } = await supabase
        .from('ride_requests' as any)
        .select('customer_id')
        .eq('id', orderId)
        .single();
      
      customerId = rideData?.customer_id;
    }
    
    // If not found in orders, try ride_requests table
    const { error: ridesError } = await supabase
      .from('ride_requests' as any)
      .update({ 
        driver_id: driverId,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (!ridesError) {
      console.log('Successfully accepted ride in ride_requests table');
      
      // Send notification to customer if we have their ID
      if (customerId) {
        try {
          await sendNotificationToUser(
            customerId,
            'Driver Accepted',
            'A driver has accepted your ride request!',
            'success'
          );
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      return { error: null };
    }
    
    error = ridesError;
  } catch (err) {
    console.error('Error accepting ride:', err);
    error = err;
  }
  
  return { error };
};

// Add a new function to save declined orders
export const saveDeclinedOrder = async (orderId: string, driverId: string): Promise<{ error: any }> => {
  try {
    // Save to local storage first (for immediate effect)
    const storageKey = `declined_orders_${driverId}`;
    const existingDeclined = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (!existingDeclined.includes(orderId)) {
      existingDeclined.push(orderId);
      localStorage.setItem(storageKey, JSON.stringify(existingDeclined));
    }
    
    // Also save to database for persistence across devices
    const { error } = await supabase
      .from('driver_declined_orders' as any)
      .insert({
        driver_id: driverId,
        order_id: orderId,
        declined_at: new Date().toISOString()
      })
      .single();
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error saving declined order:', error);
      return { error };
    }
    
    return { error: null };
  } catch (err) {
    console.error('Error in saveDeclinedOrder:', err);
    return { error: err };
  }
};

// Get all declined order IDs for a driver
export const getDeclinedOrders = async (driverId: string): Promise<string[]> => {
  try {
    // Get locally stored declined orders first (for immediate access)
    const storageKey = `declined_orders_${driverId}`;
    const localDeclinedOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Also get declined orders from the database
    const { data, error } = await supabase
      .from('driver_declined_orders' as any)
      .select('order_id')
      .eq('driver_id', driverId);
    
    if (error) {
      console.error('Error fetching declined orders from database:', error);
      return localDeclinedOrders;
    }
    
    // Combine local and database declined orders, removing duplicates
    const dbDeclinedOrders = data.map((item: any) => item.order_id);
    const allDeclinedOrders = [...new Set([...localDeclinedOrders, ...dbDeclinedOrders])];
    
    // Update localStorage with the combined list for future use
    localStorage.setItem(storageKey, JSON.stringify(allDeclinedOrders));
    
    return allDeclinedOrders;
  } catch (err) {
    console.error('Error retrieving declined orders:', err);
    
    // Fallback to local storage only if there's an error
    try {
      const storageKey = `declined_orders_${driverId}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  }
};
