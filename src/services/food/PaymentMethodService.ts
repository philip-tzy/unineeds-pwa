
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'digital';
  icon?: string;
  enabled: boolean;
}

/**
 * Gets all available payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const defaultPaymentMethods: PaymentMethod[] = [
      { id: 'cash', name: 'Cash on Delivery', type: 'cash', enabled: true },
      { id: 'credit_card', name: 'Credit Card', type: 'digital', enabled: true },
      { id: 'paypal', name: 'PayPal', type: 'digital', enabled: true },
      { id: 'apple_pay', name: 'Apple Pay', type: 'digital', enabled: true },
      { id: 'google_pay', name: 'Google Pay', type: 'digital', enabled: true },
    ];
    
    // In a real app, you would fetch this from Supabase
    // const { data, error } = await supabase
    //   .from('payment_methods')
    //   .select('*')
    //   .eq('enabled', true);
    
    // if (error) throw error;
    // return data as PaymentMethod[];
    
    return defaultPaymentMethods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Process a payment for an order
 */
export const processPayment = async (
  orderId: string, 
  paymentMethodId: string, 
  amount: number
): Promise<{ success: boolean; transactionId?: string; error?: any }> => {
  try {
    // This is a mock function - in a real app, you would integrate with a payment gateway
    console.log(`Processing payment of $${amount} for order ${orderId} using ${paymentMethodId}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, simulate successful payment
    const transactionId = `txn_${Math.random().toString(36).substring(2, 12)}`;
    
    // In a real app, you would update the order's payment status in Supabase
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error
    };
  }
};
