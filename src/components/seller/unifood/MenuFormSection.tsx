
import React from 'react';
import FoodItemForm from '@/components/seller/FoodItemForm';
import { FoodItem } from '@/types/food';

interface MenuFormSectionProps {
  isAddingItem: boolean;
  isEditingItem: boolean;
  selectedItem: FoodItem | null;
  onUpdateSuccess: () => void;
  onItemAdded: () => void;
  onCancel: () => void;
}

const MenuFormSection: React.FC<MenuFormSectionProps> = ({
  isAddingItem,
  isEditingItem,
  selectedItem,
  onUpdateSuccess,
  onItemAdded,
  onCancel,
}) => {
  if (!isAddingItem && !isEditingItem) return null;
  
  return (
    <div className="p-4">
      <FoodItemForm 
        onSuccess={isEditingItem ? onUpdateSuccess : onItemAdded} 
        onCancel={onCancel} 
        editItem={selectedItem}
      />
    </div>
  );
};

export default MenuFormSection;
