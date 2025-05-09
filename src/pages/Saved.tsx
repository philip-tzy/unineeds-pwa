import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, ShoppingBag, AlertCircle } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { FoodItem } from '@/types/food';
import FoodItemCard from '@/components/customer/FoodItemCard';
import { supabase } from '@/integrations/supabase/client';

// Definisi untuk produk toko, disadur dari UniShop.tsx atau SavedShop.tsx sebelumnya
// ID produk adalah number, berbeda dengan FoodItem yang string (UUID)
interface ShopProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  sales?: number;
  image?: string; // Ini bisa jadi class Tailwind atau URL gambar
  category?: string;
  itemType?: 'shop_product'; // Penanda tipe
}

// Menambahkan itemType ke FoodItem untuk konsistensi saat digabung
interface SavedFoodItem extends FoodItem {
  itemType?: 'food_item';
}

type SavedItem = SavedFoodItem | ShopProduct;

// Data produk statis sementara dari UniShop.tsx (atau file lain yang relevan)
// Idealnya, ini harusnya di-fetch dari Supabase berdasarkan ID yang tersimpan.
const staticShopProducts: ShopProduct[] = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, originalPrice: 99.99, rating: 4.6, sales: 240, image: 'bg-gray-200', category: 'electronics' },
  { id: 2, name: 'Smart Watch', price: 129.99, originalPrice: 159.99, rating: 4.8, sales: 320, image: 'bg-blue-200', category: 'electronics' },
  { id: 3, name: 'Backpack', price: 49.99, originalPrice: 69.99, rating: 4.5, sales: 180, image: 'bg-green-200', category: 'accessories' },
  { id: 4, name: 'Water Bottle', price: 19.99, originalPrice: 24.99, rating: 4.7, sales: 420, image: 'bg-red-200', category: 'accessories' },
  { id: 5, name: 'Desk Lamp', price: 34.99, originalPrice: 44.99, rating: 4.4, sales: 150, image: 'bg-yellow-200', category: 'electronics' },
  { id: 6, name: 'Notebook Set', price: 14.99, originalPrice: 19.99, rating: 4.3, sales: 380, image: 'bg-purple-200', category: 'books' }
];

const Saved: React.FC = () => {
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const foodIds: string[] = JSON.parse(localStorage.getItem('favorite_food_ids') || '[]');
      const productIds: number[] = JSON.parse(localStorage.getItem('favorite_shop_product_ids') || '[]');

      let fetchedFoodItems: SavedFoodItem[] = [];
      if (foodIds.length > 0) {
        const { data: foodData, error: foodError } = await supabase
          .from('food_items')
          .select('*')
          .in('id', foodIds);
        if (foodError) throw new Error(`Failed to fetch saved food items: ${foodError.message}`);
        fetchedFoodItems = (foodData || []).map(item => ({ ...item, itemType: 'food_item' }));
      }

      // Untuk produk, kita filter dari staticShopProducts
      // Idealnya, ini juga di-fetch dari Supabase
      const fetchedShopProducts: ShopProduct[] = staticShopProducts
        .filter(p => productIds.includes(p.id))
        .map(p => ({ ...p, itemType: 'shop_product' }));
      
      // Gabungkan dan urutkan (opsional, misalnya berdasarkan nama atau tanggal disimpan jika ada)
      // Untuk saat ini, kita gabungkan saja
      setSavedItems([...fetchedFoodItems, ...fetchedShopProducts]);

    } catch (err) {
      console.error("Error fetching saved items:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const handleToggleFavorite = (item: SavedItem) => {
    let newSavedItems = [...savedItems];

    if (item.itemType === 'food_item') {
      const currentFoodIds: string[] = JSON.parse(localStorage.getItem('favorite_food_ids') || '[]');
      const updatedFoodIds = currentFoodIds.filter(id => id !== item.id);
      localStorage.setItem('favorite_food_ids', JSON.stringify(updatedFoodIds));
      newSavedItems = newSavedItems.filter(i => !(i.itemType === 'food_item' && i.id === item.id));
    } else if (item.itemType === 'shop_product') {
      const currentProductIds: number[] = JSON.parse(localStorage.getItem('favorite_shop_product_ids') || '[]');
      const updatedProductIds = currentProductIds.filter(id => id !== item.id); // item.id disini adalah number
      localStorage.setItem('favorite_shop_product_ids', JSON.stringify(updatedProductIds));
       newSavedItems = newSavedItems.filter(i => !(i.itemType === 'shop_product' && i.id === item.id));
    }
    setSavedItems(newSavedItems);
  };

  const renderShopProductCard = (product: ShopProduct) => {
    // Tampilan sederhana untuk produk toko, bisa dikembangkan
    return (
      <div key={`product-${product.id}`} className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm animate-scale-in flex flex-col">
        <div className={`h-40 ${product.image || 'bg-gray-300'} flex items-center justify-center relative`}>
          {product.image && !product.image.startsWith('bg-') ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : product.image?.startsWith('bg-') ? (
             <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={40}/></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag size={40}/></div>
          )}
          <button 
            className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            onClick={() => handleToggleFavorite(product)}
          >
            <Heart size={18} className="text-red-500 fill-red-500" />
          </button>
        </div>
        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-sm font-semibold line-clamp-2 h-10 mb-1">{product.name}</h3>
          <div className="mt-auto">
            <div className="flex items-end mb-1">
              <span className="text-red-600 font-bold text-base mr-2">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-gray-400 text-xs line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              {product.rating && (
                <div className="flex items-center">
                  <Star size={12} className="text-yellow-500 mr-0.5" fill="currentColor" />
                  <span>{product.rating}</span>
                </div>
              )}
              {product.sales && <span>{product.sales} sold</span>}
            </div>
            {/* Pertimbangkan tombol "View Product" atau "Add to Cart" */}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16">
        <p>Loading saved items...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-40">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Saved Items</h1>
        <div className="w-8"></div>
      </div>
      
      <main className="container mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {savedItems.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved items yet</h2>
              <p className="text-gray-500 mb-4">
                Items you save will appear here for quick access.
              </p>
              <button 
                onClick={() => navigate('/')} // Arahkan ke home atau halaman discovery
                className="bg-[#003160] text-white py-2 px-4 rounded-lg hover:bg-[#004180] transition-colors"
              >
                Browse Items
              </button>
            </div>
          </div>
        )}
        {savedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedItems.map(item => {
              if (item.itemType === 'food_item') {
                // Arahkan ke detail makanan atau fungsi addToCart yang sesuai jika ada
                // Props onAddToCart dan onViewDetails mungkin perlu dummy atau disesuaikan
                return (
                  <FoodItemCard
                    key={`food-${item.id}`}
                    item={item as SavedFoodItem}
                    onAddToCart={() => console.log('Add to cart from saved:', item.name)} // Sesuaikan
                    onViewDetails={() => console.log('View details from saved:', item.name)} // Sesuaikan
                    isFavorite={true} // Selalu true di halaman saved
                    onToggleFavorite={() => handleToggleFavorite(item)}
                  />
                );
              } else if (item.itemType === 'shop_product') {
                return renderShopProductCard(item as ShopProduct);
              }
              return null;
            })}
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Saved;
