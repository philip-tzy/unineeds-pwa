
import { useState } from 'react';
import { FoodItem } from '@/types/food';
import { useToast } from '@/components/ui/use-toast';

export interface CartItem {
  item: FoodItem;
  quantity: number;
  notes?: string;
}

export function useCart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item: FoodItem) => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      setSelectedSellerId(item.user_id);
      setCartItems([{ item, quantity: 1 }]);
      toast({
        title: "Added to Cart",
        description: `${item.name} has been added to your cart.`,
      });
      return;
    }
    
    // Check if item is from the same seller
    if (selectedSellerId !== item.user_id) {
      toast({
        title: "Different Seller",
        description: "Items in your cart are from a different restaurant. Clear your cart to add items from this restaurant.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if item is already in cart
    const existingItem = cartItems.find(cartItem => cartItem.item.id === item.id);
    if (existingItem) {
      updateCartItemQuantity(item.id, existingItem.quantity + 1);
    } else {
      setCartItems([...cartItems, { item, quantity: 1 }]);
      toast({
        title: "Added to Cart",
        description: `${item.name} has been added to your cart.`,
      });
    }
  };
  
  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems(
      cartItems.map(item => 
        item.item.id === itemId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const removeCartItem = (itemId: string) => {
    const newCartItems = cartItems.filter(item => item.item.id !== itemId);
    setCartItems(newCartItems);
    
    if (newCartItems.length === 0) {
      setSelectedSellerId(null);
    }
  };
  
  const clearCart = () => {
    setCartItems([]);
    setSelectedSellerId(null);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    selectedSellerId,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    cartItemCount
  };
}
