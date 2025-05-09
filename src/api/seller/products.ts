import { supabase, checkUserRole } from '@/lib/supabase';
import type { Product } from '@/types/database';

export const sellerProductsApi = {
  // Get all products for the current seller
  getProducts: async () => {
    const user = await checkUserRole('seller');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Product[];
  },

  // Get a single product
  getProduct: async (productId: string) => {
    const user = await checkUserRole('seller');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single();
      
    if (error) throw error;
    return data as Product;
  },

  // Create a new product
  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const user = await checkUserRole('seller');
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...productData, seller_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return data as Product;
  },

  // Update a product
  updateProduct: async (productId: string, productData: Partial<Product>) => {
    const user = await checkUserRole('seller');
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .eq('seller_id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Product;
  },

  // Delete a product
  deleteProduct: async (productId: string) => {
    const user = await checkUserRole('seller');
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', user.id);
      
    if (error) throw error;
  }
}; 