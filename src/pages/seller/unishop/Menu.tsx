
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Package } from 'lucide-react';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ProductForm from '@/components/seller/ProductForm';
import ProductsList from '@/components/seller/ProductsList';
import { Product } from '@/types/product';

const UniShopMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  
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
  
  const handleEditItem = (item: Product) => {
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
      description: "Product has been successfully updated.",
    });
  };
  
  // Insert sample data on first load if user doesn't have any items
  useEffect(() => {
    if (!user) return;
    
    const checkAndAddSampleData = async () => {
      // Check if user has any products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error checking products:", error);
        return;
      }
      
      // If user has no products, add sample data
      if (data.length === 0) {
        const sampleItems = [
          {
            user_id: user.id,
            name: "Wireless Earbuds",
            description: "High-quality wireless earbuds with noise cancellation",
            price: 49.99,
            category: "Electronics",
            inventory: 15,
            is_active: true
          },
          {
            user_id: user.id,
            name: "Laptop Backpack",
            description: "Durable backpack with padded laptop compartment and USB charging port",
            price: 39.99,
            category: "Accessories",
            inventory: 20,
            is_active: true
          },
          {
            user_id: user.id,
            name: "Smart Water Bottle",
            description: "Insulated bottle that tracks your water intake and reminds you to stay hydrated",
            price: 24.99,
            category: "Health",
            inventory: 30,
            is_active: true
          }
        ];
        
        // Insert sample items
        const { error: insertError } = await supabase
          .from('products')
          .insert(sampleItems);
          
        if (insertError) {
          console.error("Error adding sample data:", insertError);
        } else {
          toast({
            title: "Sample Products Created",
            description: "We've added some sample products to get you started.",
          });
        }
      }
    };
    
    checkAndAddSampleData();
  }, [user, toast]);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/seller/unishop/dashboard')} 
            className="p-1 rounded-full hover:bg-[#002040] transition-colors mr-2"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Manage Products</h1>
        </div>
      </header>
      
      {/* Add/Edit Form */}
      {(isAddingItem || isEditingItem) && (
        <div className="p-4">
          <ProductForm 
            onSuccess={isEditingItem ? handleUpdateSuccess : handleItemAdded} 
            onCancel={handleCancelAddItem} 
            editItem={selectedItem}
          />
        </div>
      )}
      
      {/* Product Items List */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Your Products</h2>
            <p className="text-sm text-gray-500">Manage your store's products</p>
          </div>
          
          {!isAddingItem && !isEditingItem && (
            <Button 
              className="bg-[#003160] hover:bg-[#002040]"
              onClick={handleAddItemClick}
            >
              <Plus size={18} className="mr-2" />
              Add Product
            </Button>
          )}
        </div>
        
        <ProductsList onEdit={handleEditItem} />
      </div>
      
      {/* Add Button (Floating) */}
      {!isAddingItem && !isEditingItem && (
        <Button
          className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg bg-[#003160] hover:bg-[#002040]"
          onClick={handleAddItemClick}
        >
          <Plus size={24} />
        </Button>
      )}
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation sellerType="unishop" />
    </div>
  );
};

export default UniShopMenu;
