import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, Star, Heart, BellRing, Percent, Filter, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  seller_id: string;
  category: string;
  image_url?: string;
  service_type: 'unishop';
  created_at: string;
  seller?: {
    id: string;
    name: string;
  };
}

const UniShop: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:seller_id(id, name)
        `)
        .eq('service_type', 'unishop')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(product => product.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (product: Product) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to place an order",
          variant: "destructive"
        });
        return;
      }

      const quantity = 1; // Default quantity for simple implementation
      const total_price = product.price * quantity;

      // Create the order
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            seller_id: product.seller_id,
            product_id: product.id,
            quantity,
            total_price,
            order_status: 'pending',
            service_type: 'unishop'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Order Placed",
        description: `Your order for ${product.name} has been placed successfully!`,
      });
      
      // Navigate to history/orders page
      navigate('/history');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate('/')} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">UniShop</h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Heart size={22} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pt-4">
        <div className="flex items-center mb-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button className="ml-auto text-purple-600 text-sm flex items-center">
            <Filter size={16} className="mr-1" />
            Filter
          </button>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm flex-shrink-0 ${
              selectedCategory === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm flex-shrink-0 ${
                selectedCategory === category 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Products</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className={`h-32 ${product.image_url ? '' : 'bg-gray-200'} flex items-center justify-center`}>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag size={32} className="text-gray-400" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-1">
                    {product.seller?.name || 'Unknown Seller'}
                  </p>
                  <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-purple-600">${product.price.toFixed(2)}</p>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 p-0 h-8 w-8 rounded-full"
                      onClick={() => handlePlaceOrder(product)}
                    >
                      <ShoppingBag size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">No Products Found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? `No products matching "${searchQuery}"` 
                : "No products available in this category"}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UniShop;
