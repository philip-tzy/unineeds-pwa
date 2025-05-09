
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';

export const createFoodItem = async (
  userId: string, 
  name: string, 
  description: string | null, 
  price: number,
  imageUrl: string | null = null,
  category: string | null = null,
  preparationTime: number | null = null,
  isAvailable: boolean = true,
  stock: number = 0
) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .insert({
        user_id: userId,
        name,
        description,
        price,
        image_url: imageUrl,
        category,
        preparation_time: preparationTime,
        is_available: isAvailable,
        stock
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating food item:', error);
    throw error;
  }
};

export const updateFoodItem = async (
  id: string,
  updates: Partial<FoodItem>
) => {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating food item with id ${id}:`, error);
    throw error;
  }
};

export const deleteFoodItem = async (id: string) => {
  try {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting food item with id ${id}:`, error);
    throw error;
  }
};
