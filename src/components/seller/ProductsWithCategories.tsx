
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, PenSquare, Trash2, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryManager from './CategoryManager';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  category_id: string | null;
  is_active: boolean;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductsWithCategoriesProps {
  onRefresh?: () => void;
}

const ProductsWithCategories: React.FC<ProductsWithCategoriesProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [selectedCategoryId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          description,
          category,
          category_id,
          is_active,
          image_url
        `)
        .eq('user_id', user?.id);
      
      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }
      
      const { data, error } = await query
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setProducts(data || []);
      // Call onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/seller/unishop/edit-product/${product.id}`);
  };

  const handleAddProduct = () => {
    navigate('/seller/unishop/add-product');
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {selectedCategoryId 
                ? `Products in ${categories.find(c => c.id === selectedCategoryId)?.name || 'Category'}`
                : 'All Products'
              }
            </h2>
            <div className="flex gap-2">
              {selectedCategoryId && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <Filter size={14} className="mr-1" />
                  Clear Filter
                </Button>
              )}
              <Button 
                size="sm"
                onClick={handleAddProduct}
                className="bg-[#003160] hover:bg-[#002040]"
              >
                <Plus size={14} className="mr-1" />
                Add Product
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">No products found</p>
              <Button 
                onClick={handleAddProduct}
                className="bg-[#003160] hover:bg-[#002040]"
              >
                <Plus size={16} className="mr-2" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 mr-2">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.category && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      )}
                      {product.category_id && categories.find(c => c.id === product.category_id) && (
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                          {categories.find(c => c.id === product.category_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditProduct(product)}
                    >
                      <PenSquare size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryManager 
            onSelectCategory={handleCategorySelect} 
            selectedCategoryId={selectedCategoryId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsWithCategories;
