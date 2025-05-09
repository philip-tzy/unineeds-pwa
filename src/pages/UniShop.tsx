import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag, Star, Heart, BellRing, Percent, Camera, BarChart4, Tag, Gift, Clock, Truck, Headphones } from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 79.99,
    originalPrice: 99.99,
    rating: 4.6,
    sales: 240,
    image: 'bg-gray-200',
    category: 'electronics'
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.8,
    sales: 320,
    image: 'bg-blue-200',
    category: 'electronics'
  },
  {
    id: 3,
    name: 'Backpack',
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.5,
    sales: 180,
    image: 'bg-green-200',
    category: 'accessories'
  },
  {
    id: 4,
    name: 'Water Bottle',
    price: 19.99,
    originalPrice: 24.99,
    rating: 4.7,
    sales: 420,
    image: 'bg-red-200',
    category: 'accessories'
  },
  {
    id: 5,
    name: 'Desk Lamp',
    price: 34.99,
    originalPrice: 44.99,
    rating: 4.4,
    sales: 150,
    image: 'bg-yellow-200',
    category: 'electronics'
  },
  {
    id: 6,
    name: 'Notebook Set',
    price: 14.99,
    originalPrice: 19.99,
    rating: 4.3,
    sales: 380,
    image: 'bg-purple-200',
    category: 'books'
  }
];

const categories = [
  { id: 'all', name: 'All', icon: <ShoppingBag size={18} /> },
  { id: 'electronics', name: 'Electronics', icon: <Headphones size={18} /> },
  { id: 'accessories', name: 'Accessories', icon: <Tag size={18} /> },
  { id: 'books', name: 'Books', icon: <BarChart4 size={18} /> },
  { id: 'clothing', name: 'Clothing', icon: <ShoppingBag size={18} /> }
];

const flashDeals = [
  {
    id: 101,
    name: 'Flash Deal',
    discount: '50% OFF',
    image: 'bg-orange-200',
    timeLeft: '3h 24m'
  },
  {
    id: 102,
    name: 'Clearance',
    discount: '30% OFF',
    image: 'bg-blue-200',
    timeLeft: '1h 15m'
  },
  {
    id: 103,
    name: 'Special Offer',
    discount: '20% OFF',
    image: 'bg-green-200',
    timeLeft: '5h 45m'
  }
];

const UniShop: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('favorite_shop_product_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavoriteProduct = (productId: number) => {
    setFavoriteProductIds((prev) => {
      let updated;
      if (prev.includes(productId)) {
        updated = prev.filter(id => id !== productId);
      } else {
        updated = [...prev, productId];
      }
      localStorage.setItem('favorite_shop_product_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);
  
  return (
    <div className="min-h-screen bg-gray-100 animate-fade-in">
      {/* App Bar */}
      <div className="bg-[#003160] p-4 flex items-center text-white">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-[#004180] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 relative mx-2">
          <input
            type="text"
            placeholder="Search in UniShop"
            className="w-full bg-[#004180] border-none rounded-full py-1.5 px-4 pl-9 outline-none text-white placeholder-gray-300 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
          <Camera className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
        </div>
        <button className="p-1.5 relative">
          <BellRing size={20} />
          <span className="absolute top-0 right-0 bg-[#B10000] text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">3</span>
        </button>
        <button className="p-1.5 ml-1">
          <ShoppingBag size={20} />
        </button>
      </div>
      
      {/* Banner */}
      <div className="bg-[#003160] px-4 pb-4 text-white">
        <div className="bg-blue-400 h-28 rounded-lg flex items-center justify-center">
          <h2 className="text-xl font-bold">Mega Sale: Up to 70% OFF</h2>
        </div>
      </div>
      
      {/* Categories */}
      <div className="bg-white py-3 px-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex flex-col items-center"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                selectedCategory === category.id 
                  ? 'bg-[#003160] text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {category.icon}
              </div>
              <span className="text-xs text-center">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Flash Deals */}
      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Clock size={18} className="text-[#B10000] mr-1" />
            <h2 className="text-base font-bold">Flash Deals</h2>
          </div>
          <button className="text-sm text-[#003160]">See All</button>
        </div>
        
        <div className="flex overflow-x-auto gap-3 pb-2">
          {flashDeals.map((deal) => (
            <div key={deal.id} className="min-w-28 bg-gray-50 rounded-lg border border-gray-200 animate-scale-in">
              <div className={`h-24 ${deal.image} flex items-center justify-center relative`}>
                <div className="absolute top-0 left-0 bg-[#B10000] text-white text-xs px-2 py-1 rounded-br-lg">
                  {deal.discount}
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs">{deal.name}</p>
                <div className="flex items-center mt-1 text-xs text-[#B10000]">
                  <Clock size={10} className="mr-1" />
                  <span>{deal.timeLeft}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Products */}
      <div className="p-4">
        <h2 className="text-base font-bold mb-3">Recommended For You</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg overflow-hidden border border-gray-200 animate-scale-in">
              <div className={`h-32 ${product.image} relative`}>
                <div className="absolute top-0 left-0 bg-[#B10000] text-white text-xs px-2 py-1 rounded-br-lg">
                  {Math.round((product.originalPrice - product.price) / product.originalPrice * 100)}% OFF
                </div>
                <button 
                  className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm"
                  onClick={() => toggleFavoriteProduct(product.id)}
                >
                  <Heart size={16} className={favoriteProductIds.includes(product.id) ? "text-red-500 fill-red-500" : "text-gray-500"} />
                </button>
              </div>
              <div className="p-3">
                <h3 className="text-xs line-clamp-2 h-8">{product.name}</h3>
                <div className="mt-1 flex items-end">
                  <span className="text-[#B10000] font-bold text-sm">${product.price}</span>
                  <span className="text-gray-400 text-xs line-through ml-1">${product.originalPrice}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <div className="flex items-center">
                    <Star size={10} className="text-yellow-500 mr-1" fill="currentColor" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-gray-500">{product.sales} sold</span>
                </div>
                <button className="mt-2 bg-[#003160] text-white py-1 px-3 rounded text-xs w-full">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UniShop;
