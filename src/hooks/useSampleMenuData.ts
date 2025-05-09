
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useSampleMenuData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user) return;
    
    const checkAndAddSampleData = async () => {
      // Check if user has any food items
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error checking food items:", error);
        return;
      }
      
      // If user has no food items, add sample data
      if (data.length === 0) {
        const sampleItems = [
          {
            user_id: user.id,
            name: "Classic Cheeseburger",
            description: "Juicy beef patty with melted cheese, lettuce, tomato, and special sauce",
            price: 8.99,
            category: "Main Course",
            preparation_time: 15,
            is_available: true,
            stock: 10
          },
          {
            user_id: user.id,
            name: "Chicken Caesar Salad",
            description: "Fresh romaine lettuce with grilled chicken, parmesan cheese, and Caesar dressing",
            price: 7.99,
            category: "Salad",
            preparation_time: 10,
            is_available: true,
            stock: 8
          },
          {
            user_id: user.id,
            name: "Chocolate Brownie",
            description: "Rich chocolate brownie with vanilla ice cream",
            price: 4.99,
            category: "Dessert",
            preparation_time: 5,
            is_available: true,
            stock: 15
          }
        ];
        
        // Insert sample items
        const { error: insertError } = await supabase
          .from('food_items')
          .insert(sampleItems);
          
        if (insertError) {
          console.error("Error adding sample data:", insertError);
        } else {
          toast({
            title: "Sample Menu Created",
            description: "We've added some sample menu items to get you started.",
          });
        }
      }
    };
    
    checkAndAddSampleData();
  }, [user, toast]);
};
