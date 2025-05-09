
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import CategoryManager from '@/components/seller/CategoryManager';
import ProductsList from '@/components/seller/ProductsList';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // Additional logic for category selection if needed
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch products. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategoryId, user]);

  // Add this function to handle edit functionality
  const handleEditProduct = (product: Product) => {
    navigate(`/seller/unishop/edit-product/${product.id}`);
  };

  return (
    <div className="container py-4 px-4 md:px-6 relative min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Button onClick={() => navigate('/seller/unishop/products/new')} className="bg-blue-500 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
      
      <div className="mt-4">
        <CategoryManager 
          key={1} 
          onCategoryChange={() => fetchProducts()} 
          onSelectCategory={handleSelectCategory}
          selectedCategoryId={selectedCategoryId}
        />
      </div>

      <ProductsList onEdit={handleEditProduct} />
    </div>
  );
};

export default ProductsPage;
