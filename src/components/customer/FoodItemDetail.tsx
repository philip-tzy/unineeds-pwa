
import React from 'react';
import { FoodItem } from '@/types/food';
import { Button } from '@/components/ui/button';
import { Coffee, Star, Clock, MapPin } from 'lucide-react';

interface FoodItemDetailProps {
  item: FoodItem;
  onClose: () => void;
  onAddToCart: (item: FoodItem) => void;
}

const FoodItemDetail: React.FC<FoodItemDetailProps> = ({ item, onClose, onAddToCart }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="h-48 bg-gray-200">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-100">
              <Coffee size={48} className="text-gray-500" />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">{item.name}</h2>
            <div className="flex items-center text-sm bg-green-50 px-2 py-0.5 rounded">
              <Star size={14} className="text-yellow-500 mr-1" fill="currentColor" />
              <span>4.5</span>
            </div>
          </div>
          
          <p className="text-gray-600 mt-2">{item.description || 'No description available'}</p>
          
          <div className="flex items-center mt-3 text-sm text-gray-500">
            {item.category && (
              <div className="flex items-center mr-4">
                <MapPin size={14} className="mr-1" />
                <span>{item.category}</span>
              </div>
            )}
            {item.preparation_time && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>{item.preparation_time} mins prep time</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button 
                  className="bg-uniblue"
                  onClick={() => {
                    onAddToCart(item);
                    onClose();
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodItemDetail;
