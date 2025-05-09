
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsWithCategories from '@/components/seller/ProductsWithCategories';
import CategoryManager from '@/components/seller/CategoryManager';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh the products list
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddProduct = () => {
    navigate('/seller/unishop/add-product');
  };

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate('/seller/unishop/dashboard')} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Products</h1>
        <button 
          onClick={handleAddProduct} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <PlusCircle size={24} />
        </button>
      </div>
      
      {/* Content */}
      <div className="container p-4">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            <ProductsWithCategories 
              key={refreshTrigger}
              onRefresh={handleRefresh} 
            />
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <CategoryManager 
              key={refreshTrigger}
              onSelectCategory={handleSelectCategory}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation sellerType="unishop" />
    </div>
  );
};

export default ProductsPage;
