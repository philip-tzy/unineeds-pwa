
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Package, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';

interface ProductsListProps {
  onEdit: (item: Product) => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ onEdit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async (item: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(products.map(i => 
        i.id === item.id 
          ? { ...i, is_active: !item.is_active } 
          : i
      ));
      
      toast({
        title: `Product ${!item.is_active ? 'Activated' : 'Deactivated'}`,
        description: `${item.name} is now ${!item.is_active ? 'available' : 'unavailable'} for purchase`,
      });
    } catch (err) {
      console.error('Error updating product availability:', err);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string, name: string) => {
    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setProducts(products.filter(item => item.id !== id));
      
      toast({
        title: "Product Deleted",
        description: `${name} has been removed from your store`,
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Package className="animate-pulse text-gray-400 mr-2" />
        <span>Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
        <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-semibold">Error loading products</p>
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
            onClick={() => fetchProducts()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <Package className="mx-auto text-gray-400 mb-2" size={32} />
        <h3 className="text-lg font-medium text-gray-700">No products yet</h3>
        <p className="text-gray-500 mb-4">Add your first product to start selling</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map(item => (
        <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm flex">
          <div className={`w-16 h-16 ${item.image_url ? '' : 'bg-blue-100'} rounded-lg flex items-center justify-center mr-3`}>
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="text-gray-700" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                )}
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => deleteItem(item.id, item.name)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">${Number(item.price).toFixed(2)}</span>
                {item.inventory !== null && (
                  <span className="text-xs text-gray-500">Stock: {item.inventory}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <Switch 
                  checked={item.is_active || false} 
                  onCheckedChange={() => toggleAvailability(item)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsList;
