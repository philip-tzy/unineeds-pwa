
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FoodItemsList from '@/components/seller/FoodItemsList';
import { FoodItem } from '@/types/food';

interface MenuListSectionProps {
  isAddingItem: boolean;
  isEditingItem: boolean;
  onAddItemClick: () => void;
  onEditItem: (item: FoodItem) => void;
}

const MenuListSection: React.FC<MenuListSectionProps> = ({
  isAddingItem,
  isEditingItem,
  onAddItemClick,
  onEditItem,
}) => {
  if (isAddingItem || isEditingItem) return null;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Menu Items</h2>
          <p className="text-sm text-gray-500">Manage your restaurant's offerings</p>
        </div>
        
        <Button 
          className="bg-[#003160] hover:bg-[#002040]"
          onClick={onAddItemClick}
        >
          <Plus size={18} className="mr-2" />
          Add Item
        </Button>
      </div>
      
      <FoodItemsList onEdit={onEditItem} />
    </div>
  );
};

export default MenuListSection;
