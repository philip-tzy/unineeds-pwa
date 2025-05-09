
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductFormWithCategories from '@/components/seller/ProductFormWithCategories';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!user || !id) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, user, toast]);
  
  const handleSuccess = () => {
    toast({
      title: "Product Updated",
      description: "Your product has been updated successfully",
    });
    navigate('/seller/unishop/products');
  };
  
  const handleCancel = () => {
    navigate('/seller/unishop/products');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate('/seller/unishop/products')} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Edit Product</h1>
        <div className="w-10"></div>
      </div>
      
      {/* Content */}
      <div className="container p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : product ? (
          <ProductFormWithCategories 
            editItem={product} 
            onSuccess={handleSuccess} 
            onCancel={handleCancel}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">Product not found or you don't have permission to edit it.</p>
            <Button onClick={() => navigate('/seller/unishop/products')}>
              Back to Products
            </Button>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation sellerType="unishop" />
    </div>
  );
};

export default EditProduct;
