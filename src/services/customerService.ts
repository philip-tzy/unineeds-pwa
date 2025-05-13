import { supabase } from '@/integrations/supabase/client';

/**
 * Get all available UniShop products for customers
 */
export const getUniShopProducts = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_items_by_service_type', { p_service_type: 'unishop' });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching UniShop products:', error);
    throw error;
  }
};

/**
 * Get all available UniFood items for customers
 */
export const getUniFoodItems = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_customer_items_by_service_type', { p_service_type: 'unifood' });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching UniFood items:', error);
    throw error;
  }
};

/**
 * Subscribe to UniShop products changes for real-time updates
 */
export const subscribeToUniShopProducts = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('public:products')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: 'service_type=eq.unishop'
      }, 
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to UniFood items changes for real-time updates
 */
export const subscribeToUniFoodItems = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('public:food_items')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'food_items',
        filter: 'service_type=eq.unifood'
      }, 
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}; 