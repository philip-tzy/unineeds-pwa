import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Clock, Package, ShoppingBag, Coffee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/BottomNavigation';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';

interface OrderItem {
  id: string;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  service_type: 'unishop' | 'unifood';
  total_price: number;
  quantity: number;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
  food_items?: {
    id: string;
    name: string;
    image_url?: string;
  };
  seller?: {
    id: string;
    name: string;
  };
}

const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrderHistory();
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products(*),
          food_items(*),
          seller:seller_id(id, name)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setOrderHistory(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    return serviceType === 'unishop' 
      ? <ShoppingBag className="h-5 w-5 text-[#003160]" />
      : <Coffee className="h-5 w-5 text-orange-600" />;
  };

  const filteredOrders = activeTab === 'all' 
    ? orderHistory 
    : orderHistory.filter(order => order.service_type === activeTab);

  const renderBottomNavigation = () => {
    if (!user) return <BottomNavigation />;
    
    switch (user.role) {
      case 'driver':
        return <DriverBottomNavigation />;
      case 'seller':
        return <SellerBottomNavigation />;
      case 'freelancer':
        return <FreelancerBottomNavigation />;
      default:
        return <BottomNavigation />;
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-[#003160] text-white p-4 relative">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full bg-white/20 text-white mr-3"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-semibold">Order History</h1>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unishop">UniShop</TabsTrigger>
            <TabsTrigger value="unifood">UniFood</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-[#003160] border-t-transparent rounded-full"></div>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getServiceIcon(order.service_type)}
                          <div className="ml-2">
                            <h3 className="font-medium">
                              {order.service_type === 'unishop' 
                                ? order.product?.name || 'UniShop Product'
                                : order.food_items?.name || 'Food Item'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {order.seller?.name || 'Unknown Seller'} • {format(new Date(order.created_at), 'PP')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.order_status)}>
                          <span className="capitalize">{order.order_status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Quantity: {order.quantity}</p>
                          <p className="font-medium">Total: ${order.total_price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock size={14} className="mr-1" />
                          <span>{format(new Date(order.created_at), 'p')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Package size={48} className="mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">No Orders</h3>
                <p className="text-sm text-gray-500">You haven't placed any orders yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {renderBottomNavigation()}
    </div>
  );
};

export default History;
