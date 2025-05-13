import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProductFormWithCategories from '@/components/seller/ProductFormWithCategories';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSuccess = () => {
    toast({
      title: "Product Added",
      description: "Your product has been added successfully to UniShop",
    });
    navigate('/seller/unishop/products');
  };
  
  const handleCancel = () => {
    navigate('/seller/unishop/products');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* App Bar */}
      <div className="bg-[#003160] text-white p-4 flex items-center">
        <button 
          onClick={() => navigate('/seller/unishop/products')} 
          className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Add UniShop Product</h1>
        <div className="w-10 flex justify-center">
          <ShoppingBag size={24} />
        </div>
      </div>
      
      {/* Content */}
      <div className="container p-4">
        <ProductFormWithCategories 
          onSuccess={handleSuccess} 
          onCancel={handleCancel}
          serviceType="unishop"
        />
      </div>
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation />
    </div>
  );
};

export default AddProduct;
