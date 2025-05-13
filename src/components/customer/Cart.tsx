import React, { useState, useEffect } from 'react';
import { ShoppingCart, ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import Checkout from './Checkout';
import { Skeleton } from '@/components/ui/skeleton';

// Define the CartItem interface
export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    seller_id: string;
  };
  notes?: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen, user]);

  // Load cart items from localStorage
  const loadCartItems = () => {
    setIsLoading(true);
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load your cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Save cart items to localStorage
  const saveCartItems = (items: CartItem[]) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
      toast.error('Failed to save your cart');
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    const newQuantity = Math.max(1, quantity); // Ensure quantity is at least 1
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    saveCartItems(updatedItems);
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    saveCartItems(updatedItems);
    toast.info('Item removed from cart');
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
    saveCartItems([]);
    toast.info('Cart cleared');
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Fixed delivery fee
  const deliveryFee = 3.99;

  // Calculate total amount
  const calculateTotal = () => {
    return calculateSubtotal() + deliveryFee;
  };

  // Proceed to checkout
  const handleCheckout = () => {
    if (!user) {
      toast.error('Please log in to checkout');
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
  };

  // Handle checkout completion
  const handleCheckoutComplete = () => {
    setIsCheckingOut(false);
    clearCart();
    onClose();
    toast.success('Order placed successfully!');
  };

  // Handle checkout cancellation
  const handleCheckoutCancel = () => {
    setIsCheckingOut(false);
  };

  // Render the cart item
  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="flex justify-between py-3 border-b border-gray-100">
      <div className="flex">
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3">
          {item.product.image ? (
            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingBag size={20} />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium">{item.product.name}</h3>
          <div className="text-sm text-gray-500">${item.product.price.toFixed(2)}</div>
          {item.notes && <div className="text-xs text-gray-400 mt-1">Note: {item.notes}</div>}
          <div className="flex items-center mt-2">
            <button
              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 text-gray-500 rounded-l-md border border-gray-200"
            >
              -
            </button>
            <span className="px-3 py-1 border-t border-b border-gray-200">{item.quantity}</span>
            <button
              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 text-gray-500 rounded-r-md border border-gray-200"
            >
              +
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="ml-3 text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      <div className="font-medium">
        ${(item.product.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex justify-between py-3">
          <div className="flex">
            <Skeleton className="w-16 h-16 rounded-lg mr-3" />
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );

  // Render empty cart message
  const renderEmptyCart = () => (
    <div className="text-center py-8">
      <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
      <h3 className="text-lg font-medium text-gray-700">Your cart is empty</h3>
      <p className="text-gray-500 mb-4">Add items to get started</p>
      <Button onClick={onClose} className="bg-[#003160] hover:bg-[#002040]">
        Browse Products
      </Button>
    </div>
  );

  // Render cart content
  const renderCartContent = () => (
    <>
      <div className="max-h-[calc(60vh-180px)] overflow-y-auto pr-2">
        {cartItems.map(renderCartItem)}
      </div>
      
      <div className="mt-6 space-y-3">
        <Separator />
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Delivery Fee</span>
          <span className="font-medium">${deliveryFee.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${calculateTotal().toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col gap-3">
        <Button
          onClick={handleCheckout}
          className="bg-[#003160] hover:bg-[#002040] w-full"
          disabled={cartItems.length === 0}
        >
          Proceed to Checkout
        </Button>
        {cartItems.length > 0 && (
          <Button
            variant="outline"
            onClick={clearCart}
            className="w-full"
          >
            Clear Cart
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Card className="p-4 max-w-md w-full mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg flex items-center">
          <ShoppingBag className="mr-2" size={20} />
          {isCheckingOut ? 'Checkout' : 'Your Cart'}
        </h2>
        <button onClick={onClose} className="text-gray-500">
          <X size={20} />
        </button>
      </div>

      {isCheckingOut ? (
        <Checkout
          cartItems={cartItems}
          totalAmount={calculateSubtotal()}
          deliveryFee={deliveryFee}
          onCheckoutComplete={handleCheckoutComplete}
          onCheckoutCancel={handleCheckoutCancel}
        />
      ) : (
        <>
          {isLoading ? renderLoading() : (
            cartItems.length > 0 ? renderCartContent() : renderEmptyCart()
          )}
        </>
      )}
    </Card>
  );
};

export default Cart; 