
import React, { useState } from 'react';
import { Coffee, Edit, Trash2, Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { FoodItem } from '@/types/food';
import StockEditor from '@/components/seller/StockEditor';

interface FoodItemRowProps {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleAvailability: (item: FoodItem) => void;
  onUpdateStock: (itemId: string, stock: number) => void;
}

const FoodItemRow: React.FC<FoodItemRowProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleAvailability,
  onUpdateStock
}) => {
  const [editingStock, setEditingStock] = useState(false);

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm flex">
      <div className={`w-16 h-16 ${item.image_url ? '' : 'bg-orange-100'} rounded-lg flex items-center justify-center mr-3`}>
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Coffee className="text-gray-700" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
            )}
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(item.id, item.name)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="mt-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold">${Number(item.price).toFixed(2)}</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {item.is_available ? 'Available' : 'Unavailable'}
              </span>
              <Switch 
                checked={item.is_available || false} 
                onCheckedChange={() => onToggleAvailability(item)}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-1 pt-1 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Package size={14} className="text-gray-500 mr-1" />
              <span className="text-sm text-gray-500">
                Stock: {editingStock ? (
                  <StockEditor 
                    initialStock={item.stock || 0}
                    onSave={(newStock) => {
                      onUpdateStock(item.id, newStock);
                      setEditingStock(false);
                    }}
                    onCancel={() => setEditingStock(false)}
                  />
                ) : (
                  <span 
                    className="cursor-pointer underline ml-1" 
                    onClick={() => setEditingStock(true)}
                  >
                    {item.stock || 0} units
                  </span>
                )}
              </span>
            </div>
            
            {item.preparation_time && (
              <span className="text-xs text-gray-500">
                Prep: {item.preparation_time} mins
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodItemRow;
