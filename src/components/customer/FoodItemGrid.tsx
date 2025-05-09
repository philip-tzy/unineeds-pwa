import React from 'react';
import { AlertCircle, Coffee, Loader2 } from 'lucide-react';
import { FoodItem } from '@/types/food';
import FoodItemCard from './FoodItemCard';

interface FoodItemGridProps {
  foodItems: FoodItem[];
  isLoading: boolean;
  error: string | null;
  onAddToCart: (item: FoodItem) => void;
  onViewDetails: (item: FoodItem) => void;
  selectedCategory: string;
  favoriteIds: string[];
  onToggleFavorite: (item: FoodItem) => void;
}

const FoodItemGrid: React.FC<FoodItemGridProps> = ({
  foodItems,
  isLoading,
  error,
  onAddToCart,
  onViewDetails,
  selectedCategory,
  favoriteIds,
  onToggleFavorite
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin text-gray-400 mr-2" />
        <span>Loading menu items...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
        <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-semibold">Error loading menu items</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  if (foodItems.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Coffee className="mx-auto text-gray-400 mb-2" size={32} />
        <h3 className="text-lg font-medium text-gray-700">No items found</h3>
        <p className="text-gray-500">Try a different category or check back later</p>
      </div>
    );
  }
  
  return (
    <>
      <h2 className="text-lg font-bold mb-4">
        {selectedCategory === 'all' ? 'Popular Near You' : `${selectedCategory} Items`}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {foodItems.map((item) => (
          <FoodItemCard 
            key={item.id}
            item={item}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            isFavorite={favoriteIds.includes(item.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </>
  );
};

export default FoodItemGrid;
