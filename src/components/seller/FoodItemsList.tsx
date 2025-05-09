
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '@/components/seller/food/LoadingState';
import EmptyState from '@/components/seller/food/EmptyState';
import ErrorState from '@/components/seller/food/ErrorState';
import FoodItemRow from '@/components/seller/food/FoodItemRow';

interface FoodItemsListProps {
  onEdit: (item: FoodItem) => void;
}

const FoodItemsList: React.FC<FoodItemsListProps> = ({ onEdit }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFoodItems();
    }
  }, [user]);

  const fetchFoodItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, description, price, image_url, category, preparation_time, is_available, stock, user_id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFoodItems(data as FoodItem[] || []);
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (item: FoodItem) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Update local state
      setFoodItems(foodItems.map(i => 
        i.id === item.id 
          ? { ...i, is_available: !i.is_available } 
          : i
      ));
      
      toast({
        title: `Item ${!item.is_available ? 'Available' : 'Unavailable'}`,
        description: `${item.name} is now ${!item.is_available ? 'available' : 'unavailable'} for ordering`,
      });
    } catch (err) {
      console.error('Error updating item availability:', err);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateStock = async (itemId: string, stock: number) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ stock })
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Update local state
      setFoodItems(foodItems.map(i => 
        i.id === itemId 
          ? { ...i, stock } 
          : i
      ));
      
      toast({
        title: "Stock Updated",
        description: `Stock has been updated successfully`,
      });
    } catch (err) {
      console.error('Error updating stock:', err);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string, name: string) => {
    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setFoodItems(foodItems.filter(item => item.id !== id));
      
      toast({
        title: "Item Deleted",
        description: `${name} has been removed from your menu`,
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchFoodItems} />;
  }

  if (foodItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {foodItems.map(item => (
        <FoodItemRow 
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={deleteItem}
          onToggleAvailability={toggleAvailability}
          onUpdateStock={updateStock}
        />
      ))}
    </div>
  );
};

export default FoodItemsList;
