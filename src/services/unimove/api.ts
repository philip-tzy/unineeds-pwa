import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/types/unimove';

// Types for database interaction
interface DbPoint {
  x: number;
  y: number;
}

interface DbOrder extends Omit<Order, 'pickup_coordinates' | 'delivery_coordinates'> {
  pickup_coordinates: DbPoint | null;
  delivery_coordinates: DbPoint | null;
}

// Convert database point type to tuple
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

// Convert lat, lng coordinates to PostgreSQL point type format
const formatPointForDb = (coords: [number, number] | null) => {
  if (!coords) return null;
  return `(${coords[0]},${coords[1]})`;
};

// Customer APIs
export const createRideRequest = async (
  customerId: string,
  pickupAddress: string,
  destinationAddress: string,
  pickupCoords: [number, number],
  destinationCoords: [number, number],
  price: number
) => {
  console.log(`Creating ride request for customer ${customerId} from ${pickupAddress} to ${destinationAddress} for $${price}`);
  console.log('Coordinates - pickup:', pickupCoords, 'destination:', destinationCoords);
  
  try {
    // Try both approaches to maximize chance of success
    let result = null;
    let error1 = null;
    
    // First approach: create in orders table
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          seller_id: null, // No seller for ride
          pickup_address: pickupAddress,
          delivery_address: destinationAddress,
          pickup_coordinates: formatPointForDb(pickupCoords),
          delivery_coordinates: formatPointForDb(destinationCoords),
          status: 'pending',
          service_type: 'unimove',
          total_amount: price
        })
        .select()
        .single();

      if (!orderError) {
        console.log('Successfully created ride request in orders table:', orderData);
        return convertDbOrderToOrder(orderData as DbOrder);
      } else {
        console.error('Error creating in orders table:', orderError);
        error1 = orderError;
      }
    } catch (err) {
      console.error('Exception when creating in orders table:', err);
      error1 = err;
    }
    
    // Second approach: create in ride_requests table
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('ride_requests')
        .insert({
          customer_id: customerId,
          pickup_location: pickupAddress,
          dropoff_location: destinationAddress,
          price: price,
          status: 'pending',
          service_type: 'unimove'
        })
        .select()
        .single();
        
      if (!rideError) {
        console.log('Successfully created ride in ride_requests table:', rideData);
        
        // Convert to Order format
        return {
          id: rideData.id,
          customer_id: rideData.customer_id,
          driver_id: null,
          pickup_address: rideData.pickup_location,
          delivery_address: rideData.dropoff_location,
          pickup_coordinates: pickupCoords,
          delivery_coordinates: destinationCoords,
          status: rideData.status,
          service_type: 'unimove',
          total_amount: rideData.price || price,
          created_at: rideData.created_at,
          updated_at: rideData.updated_at
        } as Order;
      } else {
        console.error('Error creating in ride_requests table:', rideError);
        // If both approaches failed, throw first error
        if (error1) throw error1;
        throw rideError;
      }
    } catch (err) {
      console.error('Exception when creating in ride_requests table:', err);
      // If both approaches failed, throw first error
      if (error1) throw error1;
      throw err;
    }
  } catch (error) {
    console.error('Error creating ride request:', error);
    throw error;
  }
};

export const cancelRideRequest = async (orderId: string, customerId: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .eq('service_type', 'unimove');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error cancelling ride:', error);
    throw error;
  }
};

export const getCustomerRideHistory = async (customerId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        driver:driver_id(id, name)
      `)
      .eq('customer_id', customerId)
      .eq('service_type', 'unimove')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(order => convertDbOrderToOrder(order as DbOrder));
  } catch (error) {
    console.error('Error fetching customer ride history:', error);
    throw error;
  }
};

// Driver APIs
export const getAvailableRides = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('status', 'pending')
      .eq('service_type', 'unimove')
      .is('driver_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(order => convertDbOrderToOrder(order as DbOrder));
  } catch (error) {
    console.error('Error fetching available rides:', error);
    throw error;
  }
};

export const acceptRide = async (orderId: string, driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId, 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('service_type', 'unimove')
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return convertDbOrderToOrder(data as DbOrder);
  } catch (error) {
    console.error('Error accepting ride:', error);
    throw error;
  }
};

export const updateRideStatus = async (
  orderId: string, 
  driverId: string, 
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled'
) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .eq('driver_id', driverId)
      .eq('service_type', 'unimove')
      .select()
      .single();

    if (error) throw error;
    return convertDbOrderToOrder(data as DbOrder);
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
};

export const getDriverRideHistory = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('driver_id', driverId)
      .eq('service_type', 'unimove')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(order => convertDbOrderToOrder(order as DbOrder));
  } catch (error) {
    console.error('Error fetching driver ride history:', error);
    throw error;
  }
};

// Transaction APIs
export const createRideTransaction = async (
  orderId: string,
  customerId: string,
  driverId: string,
  amount: number,
  paymentMethod: string
) => {
  try {
    const { data, error } = await supabase
      .from('ride_transactions')
      .insert({
        order_id: orderId,
        customer_id: customerId,
        driver_id: driverId,
        amount,
        payment_method: paymentMethod,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating ride transaction:', error);
    throw error;
  }
};

export const completeRideTransaction = async (transactionId: string, driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('ride_transactions')
      .update({ 
        payment_status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId)
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing ride transaction:', error);
    throw error;
  }
}; 