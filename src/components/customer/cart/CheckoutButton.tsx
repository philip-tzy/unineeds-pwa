
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  total: number;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  onClick,
  isProcessing,
  total
}) => {
  return (
    <Button 
      className="w-full mt-4 bg-uniblue"
      onClick={onClick}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <span className="flex items-center">
          <CreditCard className="mr-2 animate-pulse" size={18} />
          Processing...
        </span>
      ) : (
        <span className="flex items-center">
          <CreditCard className="mr-2" size={18} />
          Checkout (${total.toFixed(2)})
        </span>
      )}
    </Button>
  );
};

export default CheckoutButton;
