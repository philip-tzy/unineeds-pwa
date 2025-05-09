import React, { useState, useEffect } from 'react';
import { Coffee, Pizza } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/useCart';
import FoodItemCard from '@/components/customer/FoodItemCard';
import FoodCart from '@/components/customer/FoodCart';
import FoodAppBar from '@/components/customer/FoodAppBar';
import FoodSearchBar from '@/components/customer/FoodSearchBar';
import PromoSection, { Promo } from '@/components/customer/PromoSection';
import FoodCategoryList, { Category } from '@/components/customer/FoodCategoryList';
import FoodItemGrid from '@/components/customer/FoodItemGrid';
import FoodItemDetail from '@/components/customer/FoodItemDetail';

const promos: Promo[] = [
  {
    id: 1,
    title: 'Free Delivery',
    description: 'On orders over $15',
    color: 'bg-yellow-500'
  },
  {
    id: 2,
    title: '20% OFF',
    description: 'Use code: UNIF20',
    color: 'bg-green-500'
  },
  {
    id: 3,
    title: 'Buy 1 Get 1',
    description: 'On selected items',
    color: 'bg-blue-500'
  }
];

const categories: Category[] = [
  { id: 'all', name: 'All', icon: <Coffee size={18} /> },
  { id: 'Main Course', name: 'Main Course', icon: <Pizza size={18} /> },
  { id: 'Appetizer', name: 'Appetizer', icon: <Coffee size={18} /> },
  { id: 'Dessert', name: 'Dessert', icon: <Coffee size={18} /> },
  { id: 'Beverage', name: 'Beverage', icon: <Coffee size={18} /> },
  { id: 'Breakfast', name: 'Breakfast', icon: <Coffee size={18} /> },
  { id: 'Lunch', name: 'Lunch', icon: <Pizza size={18} /> },
  { id: 'Dinner', name: 'Dinner', icon: <Pizza size={18} /> },
  { id: 'Snack', name: 'Snack', icon: <Coffee size={18} /> },
  { id: 'Salad', name: 'Salad', icon: <Coffee size={18} /> },
];

const UniFood: React.FC = () => {
  const { toast } = useToast();
  const {
    cartItems,
    selectedSellerId,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    cartItemCount
  } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_food_ids');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    fetchFoodItems();
  }, []);
  
  const fetchFoodItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('food_items')
        .select('id, name, description, price, image_url, category, preparation_time, is_available, stock, user_id, created_at, updated_at')
        .eq('is_available', true);
        
      // Apply category filter if not "all"
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setFoodItems(data as FoodItem[] || []);
    } catch (err) {
      console.error('Error fetching food items:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch food items when category or search query changes
  useEffect(() => {
    fetchFoodItems();
  }, [selectedCategory, searchQuery]);
  
  const viewItemDetails = (item: FoodItem) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFoodItems();
  };
  
  const toggleFavorite = (item: FoodItem) => {
    setFavoriteIds((prev) => {
      let updated;
      if (prev.includes(item.id)) {
        updated = prev.filter(id => id !== item.id);
      } else {
        updated = [...prev, item.id];
      }
      localStorage.setItem('favorite_food_ids', JSON.stringify(updated));
      return updated;
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar with Location */}
      <FoodAppBar 
        onCartOpen={() => setIsCartOpen(true)}
        cartItemCount={cartItemCount}
      />
      
      {/* Search Bar */}
      <FoodSearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />
      
      {/* Promo Banner */}
      <PromoSection promos={promos} />
      
      {/* Categories */}
      <FoodCategoryList 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
      
      {/* Food Items */}
      <div className="p-4">
        <FoodItemGrid 
          foodItems={foodItems}
          isLoading={isLoading}
          error={error}
          onAddToCart={addToCart}
          onViewDetails={viewItemDetails}
          selectedCategory={selectedCategory}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      </div>
      
      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-md">
            <FoodCart 
              cartItems={cartItems}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeCartItem}
              onClose={() => setIsCartOpen(false)}
              sellerId={selectedSellerId || undefined}
            />
          </div>
        </div>
      )}
      
      {/* Item Detail Modal */}
      {isItemDetailOpen && selectedItem && (
        <FoodItemDetail
          item={selectedItem}
          onClose={() => setIsItemDetailOpen(false)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

export default UniFood;
