
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';

export const getFoodItems = async (locationFilter?: string, categoryFilter?: string) => {
  try {
    let query = supabase
      .from('food_items')
      .select('id, name, description, price, image_url, category, preparation_time, is_available, stock, user_id, created_at, updated_at');
    
    // Apply is_available filter
    query = query.eq('is_available', true);
    
    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as FoodItem[];
  } catch (error) {
    console.error('Error fetching food items:', error);
    throw error;
  }
};

export const getFoodItemById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('id, name, description, price, image_url, category, preparation_time, is_available, stock, user_id, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data as FoodItem;
  } catch (error) {
    console.error(`Error fetching food item with id ${id}:`, error);
    throw error;
  }
};

export const getFoodItemsByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('id, name, description, price, image_url, category, preparation_time, is_available, stock, user_id, created_at, updated_at')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data as FoodItem[];
  } catch (error) {
    console.error(`Error fetching food items for user ${userId}:`, error);
    throw error;
  }
};
