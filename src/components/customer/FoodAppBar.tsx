
import React from 'react';
import { ArrowLeft, MapPin, ChevronDown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface FoodAppBarProps {
  onCartOpen: () => void;
  cartItemCount: number;
}

const FoodAppBar: React.FC<FoodAppBarProps> = ({ onCartOpen, cartItemCount }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-uniblue text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 ml-3">
            <div className="flex items-center">
              <span className="text-sm font-light">Deliver to</span>
              <ChevronDown size={16} className="ml-1" />
            </div>
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              <span className="font-medium">University Campus</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="relative text-white"
          onClick={onCartOpen}
        >
          <ShoppingCart size={24} />
          {cartItemCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 bg-red-500"
            >
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FoodAppBar;
