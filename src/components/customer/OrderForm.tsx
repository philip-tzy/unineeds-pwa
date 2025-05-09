import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface OrderFormProps {
  product: Product;
}

export const OrderForm: React.FC<OrderFormProps> = ({ product }) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            seller_id: product.seller_id,
            product_id: product.id,
            quantity,
            total_price: product.price * quantity,
            order_status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium">Quantity:</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </Button>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </Button>
        </div>
      </div>

      <div className="text-lg font-medium">
        Total: ${(product.price * quantity).toFixed(2)}
      </div>

      <Button
        className="w-full"
        onClick={placeOrder}
        disabled={loading}
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </Button>
    </div>
  );
}; 