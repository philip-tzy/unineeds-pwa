
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  DollarSign, 
  Truck, 
  Clock, 
  Users, 
  Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import DashboardStats from '@/components/seller/DashboardStats';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: string;
}

const UniShopSellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshStats, setRefreshStats] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, fetch from Supabase
      // For now, we're using the mock data
      const mockOrders = [
        { id: 'ORD-2345', customer: 'Alex Johnson', items: 2, total: 79.98, status: 'Ready to Ship' },
        { id: 'ORD-2344', customer: 'Sarah Miller', items: 1, total: 89.99, status: 'Processing' },
      ];
      
      setOrders(mockOrders);
      
      // In a real implementation, you'd fetch the actual orders from Supabase
      // const { data, error } = await supabase
      //   .from('orders')
      //   .select('*')
      //   .eq('seller_id', user.id)
      //   .order('created_at', { ascending: false })
      //   .limit(5);
      
      // if (error) throw error;
      // setOrders(data || []);
      
      // Trigger stats refresh
      setRefreshStats(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageProducts = () => {
    navigate('/seller/unishop/menu');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Seller Dashboard</h1>
            <p className="text-sm opacity-80">Welcome back, {user?.name}</p>
          </div>
          <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
            <ShoppingBag className="text-[#003160]" size={20} />
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="p-4">
        <DashboardStats refreshTrigger={refreshStats} />
      </div>
      
      {/* Actions */}
      <div className="p-4 bg-white shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center">
          <button 
            className="flex flex-col items-center justify-center space-y-1"
            onClick={handleManageProducts}
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Products</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1">
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Orders</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1">
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Analytics</span>
          </button>
          <button className="flex flex-col items-center justify-center space-y-1">
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Earnings</span>
          </button>
        </div>
      </div>
      
      {/* Pending Orders */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Pending Orders</h2>
          <button className="text-[#003160] text-sm">View All</button>
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
                  <span className="font-semibold">{order.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Ready to Ship' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
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
                  >
                    Process
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Products with Add Button */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Manage Store</h2>
        </div>
        
        <Button 
          className="w-full flex items-center justify-center bg-[#003160] text-white hover:bg-[#002040]"
          onClick={handleManageProducts}
        >
          <Package size={18} className="mr-2" />
          Manage Products
        </Button>
      </div>
      
      {/* Bottom Navigation */}
      <SellerBottomNavigation sellerType="unishop" />
    </div>
  );
};

export default UniShopSellerDashboard;
