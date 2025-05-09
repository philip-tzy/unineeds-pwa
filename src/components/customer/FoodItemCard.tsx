import React from 'react';
import { FoodItem } from '@/types/food';
import { Button } from '@/components/ui/button';
import { Star, Clock, MapPin, Heart, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FoodItemCardProps {
  item: FoodItem;
  onAddToCart: (item: FoodItem) => void;
  onViewDetails: (item: FoodItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (item: FoodItem) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ 
  item, 
  onAddToCart,
  onViewDetails,
  isFavorite,
  onToggleFavorite
}) => {
  const { toast } = useToast();
  
  const handleAddToCart = () => {
    if ((item.stock !== undefined && item.stock <= 0) || !item.is_available) {
      toast({
        title: "Cannot Add to Cart",
        description: "This item is currently unavailable",
        variant: "destructive"
      });
      return;
    }
    
    onAddToCart(item);
    
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    });
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-scale-in">
      <div className="relative">
        <div 
          className="h-32 bg-orange-100 flex items-center justify-center cursor-pointer"
          onClick={() => onViewDetails(item)}
        >
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-gray-400">No Image</div>
          )}
        </div>
        <button 
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
        >
          <Heart size={18} className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} />
        </button>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start">
          <h3 
            className="font-bold text-base cursor-pointer"
            onClick={() => onViewDetails(item)}
          >
            {item.name}
          </h3>
          <div className="flex items-center text-sm bg-green-50 px-2 py-0.5 rounded">
            <Star size={14} className="text-yellow-500 mr-1" fill="currentColor" />
            <span>4.5</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {item.description || 'No description available'}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
          {item.category && (
            <div className="flex items-center">
              <MapPin size={12} className="mr-1" />
              <span>{item.category}</span>
            </div>
          )}
          {item.preparation_time && (
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>{item.preparation_time} mins</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <span className="font-bold text-uniblue">${Number(item.price).toFixed(2)}</span>
          
          {!item.is_available || (item.stock !== undefined && item.stock <= 0) ? (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle size={14} className="mr-1" />
              <span>Unavailable</span>
            </div>
          ) : (
            <Button 
              className="bg-uniblue text-white py-1.5 px-4 rounded-lg text-sm"
              onClick={handleAddToCart}
            >
              <Plus size={14} className="mr-1" /> Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
