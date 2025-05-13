import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Coffee, Edit, Trash, MoreVertical, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getSellerFoodItems, subscribeToSellerFoodItems } from '@/services/sellerService';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_time: number;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
  service_type: string;
}

const FoodMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchFoodItems = async () => {
      try {
        const data = await getSellerFoodItems(user.id);
        setFoodItems(data);
      } catch (error) {
        console.error('Error fetching food items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load food menu items',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFoodItems();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSellerFoodItems(user.id, (payload) => {
      fetchFoodItems();
    });
    
    return () => {
      unsubscribe();
    };
  }, [user, toast]);
  
  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Item is now ${!item.is_available ? 'available' : 'unavailable'} for customers`,
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item availability',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    
    try {
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', deleteItemId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Food item deleted successfully',
      });
      
      setFoodItems(foodItems.filter(item => item.id !== deleteItemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete food item',
        variant: 'destructive'
      });
    } finally {
      setDeleteItemId(null);
    }
  };
  
  const formatPrice = (price: number): string => {
    return `RM ${price.toFixed(2)}`;
  };
  
  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-white hover:bg-white/20" 
            onClick={() => navigate('/seller/dashboard')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Food Menu</h1>
            <p className="text-sm opacity-80">Manage your UniFood menu items</p>
          </div>
          <div className="ml-auto">
            <Coffee size={24} />
          </div>
        </div>
      </header>
      
      {/* Add New Button */}
      <div className="p-4">
        <Button 
          onClick={() => navigate('/seller/unifood/add-item')} 
          className="w-full bg-[#003160] hover:bg-[#002040]"
        >
          <Plus size={16} className="mr-2" />
          Add New Menu Item
        </Button>
      </div>
      
      {/* Food Item List */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#003160]" />
            <p className="mt-2 text-gray-500">Loading menu items...</p>
          </div>
        ) : foodItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Coffee size={40} className="mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-900">No Menu Items Yet</h3>
            <p className="text-gray-500 mt-1">
              Add your first food item to start serving with UniFood
            </p>
            <Button 
              onClick={() => navigate('/seller/unifood/add-item')} 
              className="mt-4 bg-[#003160] hover:bg-[#002040]"
            >
              <Plus size={16} className="mr-2" />
              Add Food Item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {foodItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="h-24 w-24 object-cover" 
                    />
                  ) : (
                    <div className="h-24 w-24 bg-gray-200 flex items-center justify-center">
                      <Coffee size={24} className="text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 p-3 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description || 'No description'}</p>
                        <p className="text-[#003160] font-medium mt-1">{formatPrice(item.price)}</p>
                        <div className="mt-1">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/seller/unifood/edit-item/${item.id}`)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex justify-between items-center mt-auto pt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{item.preparation_time} min prep time</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <Switch 
                          checked={item.is_available}
                          onCheckedChange={() => handleToggleAvailability(item)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this food item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <SellerBottomNavigation />
    </div>
  );
};

export default FoodMenu;
