import { supabase, checkUserRole } from '@/lib/supabase';
import type { Order } from '@/types/database';

export const customerOrdersApi = {
  // Get all orders for the current customer
  getOrders: async () => {
    const user = await checkUserRole('customer');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Order[];
  },

  // Get a single order
  getOrder: async (orderId: string) => {
    const user = await checkUserRole('customer');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .single();
      
    if (error) throw error;
    return data as Order;
  },

  // Create a new order
  createOrder: async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    const user = await checkUserRole('customer');
    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...orderData, customer_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return data as Order;
  },

  // Update an order
  updateOrder: async (orderId: string, orderData: Partial<Order>) => {
    const user = await checkUserRole('customer');
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Order;
  },

  // Delete an order
  deleteOrder: async (orderId: string) => {
    const user = await checkUserRole('customer');
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('customer_id', user.id);
      
    if (error) throw error;
  }
}; 