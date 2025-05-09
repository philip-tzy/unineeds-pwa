
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { FoodItem } from '@/types/food';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import MenuPageHeader from '@/components/seller/unifood/MenuPageHeader';
import MenuFormSection from '@/components/seller/unifood/MenuFormSection';
import MenuListSection from '@/components/seller/unifood/MenuListSection';
import FloatingActionButton from '@/components/seller/unifood/FloatingActionButton';
import { useSampleMenuData } from '@/hooks/useSampleMenuData';

const UniFoodMenu: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  
  // Load sample data if needed
  useSampleMenuData();
  
  const handleAddItemClick = () => {
    setIsAddingItem(true);
    setIsEditingItem(false);
    setSelectedItem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelAddItem = () => {
    setIsAddingItem(false);
    setIsEditingItem(false);
    setSelectedItem(null);
  };
  
  const handleItemAdded = () => {
    setIsAddingItem(false);
    // Success message is shown in the form component
  };
  
  const handleEditItem = (item: FoodItem) => {
    setSelectedItem(item);
    setIsEditingItem(true);
    setIsAddingItem(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleUpdateSuccess = () => {
    setIsEditingItem(false);
    setSelectedItem(null);
    toast({
      title: "Item Updated",
      description: "Food item has been successfully updated.",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <MenuPageHeader />
      
      {/* Add/Edit Form */}
      <MenuFormSection 
        isAddingItem={isAddingItem}
        isEditingItem={isEditingItem}
        selectedItem={selectedItem}
        onUpdateSuccess={handleUpdateSuccess}
        onItemAdded={handleItemAdded}
        onCancel={handleCancelAddItem}
      />
      
      {/* Menu Items List */}
      <MenuListSection 
        isAddingItem={isAddingItem}
        isEditingItem={isEditingItem}
        onAddItemClick={handleAddItemClick}
        onEditItem={handleEditItem}
      />
      
      {/* Add Button (Floating) */}
      <FloatingActionButton 
        isVisible={!isAddingItem && !isEditingItem}
        onClick={handleAddItemClick}
      />
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation sellerType="unifood" />
    </div>
  );
};

export default UniFoodMenu;
