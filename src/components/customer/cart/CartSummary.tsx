
import React from 'react';

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  deliveryFee,
  total
}) => {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-500">Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Delivery Fee</span>
        <span>${deliveryFee.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default CartSummary;
