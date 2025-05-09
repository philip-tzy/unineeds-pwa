
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FoodItemsList from '@/components/seller/FoodItemsList';
import FoodItemForm from '@/components/seller/FoodItemForm';
import { FoodItem } from '@/types/food';

interface MenuItemsSectionProps {
  isAddingItem: boolean;
  onAddItemClick: () => void;
  onCancelAddItem: () => void;
  onItemAdded: () => void;
  onEditItem: (item: FoodItem) => void;
}

const MenuItemsSection: React.FC<MenuItemsSectionProps> = ({
  isAddingItem,
  onAddItemClick,
  onCancelAddItem,
  onItemAdded,
  onEditItem
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Menu Items</h2>
        <Button 
          variant="outline"
          size="sm"
          className="text-[#003160] border-[#003160]"
          onClick={onAddItemClick}
        >
          <Plus size={16} className="mr-1" /> Add Item
        </Button>
      </div>
      
      {isAddingItem ? (
        <FoodItemForm 
          onSuccess={onItemAdded} 
          onCancel={onCancelAddItem} 
        />
      ) : (
        <FoodItemsList onEdit={onEditItem} />
      )}
    </div>
  );
};

export default MenuItemsSection;
