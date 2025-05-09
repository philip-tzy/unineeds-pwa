
import React from 'react';
import { FoodItem } from '@/types/food';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartItemProps {
  item: FoodItem;
  quantity: number;
  notes?: string;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  quantity,
  notes,
  onUpdateQuantity,
  onRemoveItem
}) => {
  return (
    <div className="flex border-b border-gray-100 pb-3">
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="font-medium">{item.name}</h3>
          <button 
            onClick={() => onRemoveItem(item.id)}
            className="text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
        {notes && <div className="text-xs text-gray-400 mt-1">Note: {notes}</div>}
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
              className="px-2 py-1 text-gray-500"
              disabled={quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className="px-2">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, quantity + 1)}
              className="px-2 py-1 text-gray-500"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="font-medium">
            ${(item.price * quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
