
import { supabase } from '@/integrations/supabase/client';
import { processPayment } from './PaymentMethodService';

// Food Orders
export const createFoodOrder = async (
  customerId: string,
  sellerId: string,
  orderItems: {
    food_item_id: string;
    quantity: number;
    price: number;
    notes?: string;
  }[],
  totalAmount: number,
  paymentMethod: string,
  deliveryAddress: string
) => {
  try {
    // Create the order first with correct field mapping
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        seller_id: sellerId,
        total_amount: totalAmount,
        status: 'pending',
        delivery_address: deliveryAddress,
        service_type: 'unifood', // Add required field
        payment_status: 'pending' // Add required field
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    // Prepare order items with required subtotal field
    const orderItemsWithDetails = orderItems.map(item => ({
      order_id: orderData.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price, // Add required subtotal field
      notes: item.notes
    }));
    
    // Insert all order items at once
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithDetails);
    
    if (itemsError) throw itemsError;
    
    // Process payment if it's a digital payment method
    if (paymentMethod !== 'cash') {
      const { success, error: paymentError } = await processPayment(
        orderData.id,
        paymentMethod,
        totalAmount
      );
      
      if (!success) {
        throw paymentError || new Error('Payment processing failed');
      }
    }
    
    return {
      data: {
        order: orderData,
        items: orderItemsWithDetails
      },
      error: null
    };
  } catch (error) {
    console.error('Error creating food order:', error);
    return {
      data: null,
      error
    };
  }
};

// Get orders for a seller
export const getSellerOrders = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        total_amount,
        status,
        payment_status,
        created_at,
        delivery_address,
        order_items (
          id,
          food_item_id,
          quantity,
          price,
          subtotal,
          notes
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return { data: null, error };
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }
};
