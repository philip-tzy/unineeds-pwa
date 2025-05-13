import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import FoodItemForm from '@/components/seller/FoodItemForm';

const AddFoodItem: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSuccess = () => {
    toast({
      title: "Item Added",
      description: "Food item has been added to your UniFood menu successfully.",
    });
    navigate('/seller/unifood/menu');
  };
  
  const handleCancel = () => {
    navigate('/seller/unifood/menu');
  };
  
  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-white hover:bg-white/20" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Add Menu Item</h1>
            <p className="text-sm opacity-80">Add a new item to your UniFood menu</p>
          </div>
          <div className="ml-auto">
            <Coffee size={24} />
          </div>
        </div>
      </header>
      
      {/* Form */}
      <div className="p-4 max-w-2xl mx-auto">
        <FoodItemForm 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
      
      <SellerBottomNavigation />
    </div>
  );
};

export default AddFoodItem; 