import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Store, Coffee, Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshStats, setRefreshStats] = useState(0);

  const fetchOrders = async () => {
    setIsLoading(true);
    
    try {
      if (!user) return;
      
      // Get real orders from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products(*),
          food_items(*),
          customer:customer_id(id, name)
        `)
        .eq('seller_id', user.id)
        .eq('order_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Transform the data into the expected format
      const formattedOrders = (data || []).map(order => ({
        id: `ORD-${order.id.slice(0, 4)}`,
        customer: order.customer?.name || 'Unknown Customer',
        items: order.quantity,
        total: order.total_price,
        status: 'Pending',
        service_type: order.service_type,
        raw_order: order
      }));
      
      setOrders(formattedOrders);
      
      // Trigger stats refresh
      setRefreshStats(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      if (!user) return;
      
      // Extract the actual order ID from the formatted ID
      const actualOrderId = orderId.replace('ORD-', '');
      
      // Find the order with the matching formatted ID
      const orderToProcess = orders.find(o => o.id === orderId);
      if (!orderToProcess || !orderToProcess.raw_order) return;
      
      // Update order status in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'processing' })
        .eq('id', orderToProcess.raw_order.id);
      
      if (error) throw error;
      
      toast({
        title: "Order Processing",
        description: "Order status updated to processing"
      });
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Set up realtime subscription for new orders
      const channel = supabase
        .channel('new-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New order received:', payload);
            toast({
              title: "New Order",
              description: "You have a new order!",
            });
            fetchOrders();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Seller Dashboard</h1>
            <p className="text-sm opacity-80">Welcome back{user?.name ? `, ${user.name}` : ''}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-white/20 p-2 rounded-full">
              <Bell size={20} />
            </button>
            <button className="bg-white/20 p-2 rounded-full">
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Service Selection */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Manage Your Services</h2>
        <div className="space-y-4">
          {/* UniShop Card */}
          <div className="rounded-lg overflow-hidden">
            <div className="bg-[#003160] text-white p-4">
              <div className="flex items-center">
                <Store size={24} />
                <h3 className="text-lg font-semibold ml-2">UniShop</h3>
              </div>
              <p className="text-sm mt-1 opacity-80">Sell products to customers</p>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 bg-white">
              <Button 
                onClick={() => navigate('/seller/unishop/products')}
                className="bg-[#003160]"
              >
                View Products
              </Button>
              <Button 
                onClick={() => navigate('/seller/unishop/add-product')}
                variant="outline" 
                className="border-[#003160] text-[#003160]"
              >
                Add Product
              </Button>
            </div>
          </div>
          
          {/* UniFood Card */}
          <div className="rounded-lg overflow-hidden">
            <div className="bg-[#003160] text-white p-4">
              <div className="flex items-center">
                <Coffee size={24} />
                <h3 className="text-lg font-semibold ml-2">UniFood</h3>
              </div>
              <p className="text-sm mt-1 opacity-80">Sell food items to customers</p>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 bg-white">
              <Button 
                onClick={() => navigate('/seller/unifood/menu')}
                className="bg-[#003160]"
              >
                View Menu
              </Button>
              <Button 
                onClick={() => navigate('/seller/unifood/add-item')}
                variant="outline" 
                className="border-[#003160] text-[#003160]"
              >
                Add Food Item
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pending Orders */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Pending Orders</h2>
          <button 
            className="text-[#003160] text-sm"
            onClick={() => navigate('/seller/orders')}
          >
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-center text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-center text-gray-500">No pending orders</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-semibold">{order.id}</span>
                    {order.service_type && (
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                        order.service_type === 'unishop' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {order.service_type === 'unishop' ? 'Shop' : 'Food'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {order.customer} • {order.items} item(s)
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-[#003160] text-[#003160] hover:bg-[#003160] hover:text-white"
                    onClick={() => handleProcessOrder(order.id)}
                  >
                    Process
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation />
    </div>
  );
};

export default SellerDashboard; 