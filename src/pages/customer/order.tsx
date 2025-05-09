import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { OrderForm } from '@/components/customer/OrderForm';
import type { Product } from '@/types/database';
import { Card } from '@/components/ui/card';

export default function OrderPage() {
  const router = useRouter();
  const { productId } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <p className="text-xl font-medium mb-6">${product.price.toFixed(2)}</p>
        
        <OrderForm product={product} />
      </Card>
    </div>
  );
} 