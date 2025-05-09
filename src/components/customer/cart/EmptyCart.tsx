
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X } from 'lucide-react';

interface EmptyCartProps {
  onClose: () => void;
}

const EmptyCart: React.FC<EmptyCartProps> = ({ onClose }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Your Cart</h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={20} />
        </button>
      </div>
      <div className="text-center py-8">
        <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
        <h3 className="text-lg font-medium text-gray-700">Your cart is empty</h3>
        <p className="text-gray-500 mb-4">Add items to get started</p>
        <Button onClick={onClose} className="bg-uniblue">
          Browse Menu
        </Button>
      </div>
    </div>
  );
};

export default EmptyCart;
