
import React, { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createFoodOrder } from '@/services/food'; // Updated import
import { getPaymentMethods, PaymentMethod } from '@/services/food/PaymentMethodService';
import { useToast } from '@/components/ui/use-toast';
import CartItem from './cart/CartItem';
import CartSummary from './cart/CartSummary';
import EmptyCart from './cart/EmptyCart';
import PaymentMethodSelector from './cart/PaymentMethodSelector';
import DeliveryAddressInput from './cart/DeliveryAddressInput';
import CheckoutButton from './cart/CheckoutButton';

interface CartItem {
  item: FoodItem;
  quantity: number;
  notes?: string;
}

interface FoodCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClose: () => void;
  sellerId?: string;
}

const FoodCart: React.FC<FoodCartProps> = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onClose,
  sellerId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast({
          title: "Error",
          description: "Failed to load payment methods",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchPaymentMethods();
  }, [toast]);
  
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.item.price * item.quantity), 
    0
  );
  
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;
  
  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to complete your order",
        variant: "destructive"
      });
      return;
    }
    
    if (!deliveryAddress.trim()) {
      toast({
        title: "Delivery Address Required",
        description: "Please provide a delivery address",
        variant: "destructive"
      });
      return;
    }
    
    if (!sellerId) {
      toast({
        title: "Error",
        description: "Could not identify the seller",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderItems = cartItems.map(cartItem => ({
        food_item_id: cartItem.item.id,
        quantity: cartItem.quantity,
        price: cartItem.item.price,
        notes: cartItem.notes
      }));
      
      const { data, error } = await createFoodOrder(
        user.id,
        sellerId,
        orderItems,
        total,
        paymentMethod,
        deliveryAddress
      );
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been received and is being processed",
      });
      
      onClose();
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "There was a problem placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (cartItems.length === 0) {
    return <EmptyCart onClose={onClose} />;
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Your Cart</h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-3">
        {cartItems.map(({ item, quantity, notes }) => (
          <CartItem
            key={item.id}
            item={item}
            quantity={quantity}
            notes={notes}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
      
      <CartSummary 
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
      />
      
      <DeliveryAddressInput
        value={deliveryAddress}
        onChange={setDeliveryAddress}
      />
      
      {isLoading ? (
        <div className="mt-4 p-3 bg-gray-50 rounded animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <PaymentMethodSelector
          paymentMethods={paymentMethods}
          selectedMethod={paymentMethod}
          onChange={setPaymentMethod}
        />
      )}
      
      <CheckoutButton
        onClick={handleCheckout}
        isProcessing={isProcessing}
        total={total}
      />
    </div>
  );
};

export default FoodCart;
