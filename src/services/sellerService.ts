import { supabase } from '@/integrations/supabase/client';

interface SellerServices {
  seller_id: string;
  unishop_enabled: boolean;
  unifood_enabled: boolean;
}

interface SellerItem {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  item_type: 'product' | 'food_item';
  service_type: 'unishop' | 'unifood';
  created_at: string;
  [key: string]: any; // For additional properties specific to products or food items
}

/**
 * Get the services enabled for a seller
 */
export const getSellerServices = async (sellerId: string): Promise<SellerServices | null> => {
  try {
    const { data, error } = await supabase
      .from('seller_services')
      .select('*')
      .eq('seller_id', sellerId)
      .single();
    
    if (error) {
      console.error('Error fetching seller services:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching seller services:', error);
    return null;
  }
};

/**
 * Update the services enabled for a seller
 */
export const updateSellerServices = async (
  sellerId: string, 
  services: { unishop_enabled?: boolean, unifood_enabled?: boolean }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('seller_services')
      .update({
        ...services,
        updated_at: new Date().toISOString()
      })
      .eq('seller_id', sellerId);
    
    if (error) {
      console.error('Error updating seller services:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating seller services:', error);
    return false;
  }
};

/**
 * Get seller products (UniShop items)
 */
export const getSellerProducts = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('service_type', 'unishop')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

/**
 * Get seller food items (UniFood items)
 */
export const getSellerFoodItems = async (sellerId: string) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('service_type', 'unifood')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching seller food items:', error);
    throw error;
  }
};

/**
 * Get all items for a seller (both UniShop and UniFood)
 */
export const getSellerAllItems = async (sellerId: string): Promise<SellerItem[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_items_by_service_type', { p_service_type: 'unishop' });
    
    if (error) throw error;
    
    const { data: foodData, error: foodError } = await supabase
      .rpc('get_items_by_service_type', { p_service_type: 'unifood' });
    
    if (foodError) throw foodError;
    
    const combinedData = [
      ...data.map(item => ({ ...item, item_type: 'product' })),
      ...foodData.map(item => ({ ...item, item_type: 'food_item' }))
    ].filter(item => item.seller_id === sellerId);
    
    return combinedData;
  } catch (error) {
    console.error('Error fetching all seller items:', error);
    throw error;
  }
};

/**
 * Subscribe to seller product changes
 */
export const subscribeToSellerProducts = (sellerId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`seller_products_${sellerId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `seller_id=eq.${sellerId}` 
      }, 
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to seller food item changes
 */
export const subscribeToSellerFoodItems = (sellerId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`seller_food_items_${sellerId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'food_items',
        filter: `seller_id=eq.${sellerId}` 
      }, 
      callback
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get seller stats for both UniShop and UniFood
 */
export const getSellerStats = async (sellerId: string) => {
  try {
    // Get UniShop stats
    const { data: unishopOrders, error: unishopError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('seller_id', sellerId)
      .eq('service_type', 'unishop');
    
    if (unishopError) {
      console.error('Error fetching unishop orders:', unishopError);
    }
    
    // Get UniFood stats
    const { data: unifoodOrders, error: unifoodError } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('seller_id', sellerId)
      .eq('service_type', 'unifood');
    
    if (unifoodError) {
      console.error('Error fetching unifood orders:', unifoodError);
    }
    
    // Get products count
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);
    
    if (productsError) {
      console.error('Error fetching products count:', productsError);
    }
    
    // Get food items count
    const { count: foodItemsCount, error: foodItemsError } = await supabase
      .from('food_items')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);
    
    if (foodItemsError) {
      console.error('Error fetching food items count:', foodItemsError);
    }
    
    // Calculate total earnings and pending orders
    const allOrders = [...(unishopOrders || []), ...(unifoodOrders || [])];
    const totalEarnings = allOrders.reduce((sum, order) => {
      return order.status === 'completed' ? sum + (parseFloat(order.total_amount) || 0) : sum;
    }, 0);
    
    const pendingOrders = allOrders.filter(order => 
      ['pending', 'processing', 'ready'].includes(order.status)
    ).length;
    
    return {
      totalEarnings,
      pendingOrders,
      totalOrders: allOrders.length,
      productsCount: productsCount || 0,
      foodItemsCount: foodItemsCount || 0,
      unishopOrders: unishopOrders?.length || 0,
      unifoodOrders: unifoodOrders?.length || 0
    };
  } catch (error) {
    console.error('Unexpected error fetching seller stats:', error);
    return {
      totalEarnings: 0,
      pendingOrders: 0,
      totalOrders: 0,
      productsCount: 0,
      foodItemsCount: 0,
      unishopOrders: 0,
      unifoodOrders: 0
    };
  }
}; 