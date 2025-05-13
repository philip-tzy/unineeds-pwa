import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Clock, Check, X, AlertCircle, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
}

interface Order {
  id: string;
  customer_id: string;
  seller_id: string;
  product_id?: string;
  food_item_id?: string;
  quantity: number;
  total_price: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  service_type: 'unishop' | 'unifood';
  created_at: string;
  updated_at: string;
  
  // Joined data
  products?: Product;
  food_items?: FoodItem;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<{
    pending: Order[];
    processing: Order[];
    completed: Order[];
    cancelled: Order[];
  }>({
    pending: [],
    processing: [],
    completed: [],
    cancelled: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
      const unsubscribe = setupRealtimeSubscription();
      
      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products(*),
          food_items(*),
          customer:customer_id(id, name, email)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group orders by status
      const groupedOrders = {
        pending: (data || []).filter(order => order.order_status === 'pending'),
        processing: (data || []).filter(order => order.order_status === 'processing'),
        completed: (data || []).filter(order => order.order_status === 'completed'),
        cancelled: (data || []).filter(order => order.order_status === 'cancelled')
      };
      
      setOrders(groupedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.eventType === 'INSERT') {
            // Show notification for new order
            toast({
              title: "New Order Received!",
              description: "You have a new order waiting for your attention",
            });
          }
          fetchOrders(); // Refresh orders
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Order has been ${newStatus}`,
      });
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="mr-1" />;
      case 'processing':
        return <AlertCircle size={14} className="mr-1" />;
      case 'completed':
        return <Check size={14} className="mr-1" />;
      case 'cancelled':
        return <X size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  const getServiceIcon = (serviceType: 'unishop' | 'unifood') => {
    return serviceType === 'unishop' 
      ? <ShoppingBag size={16} className="text-purple-600 mr-1" />
      : <Coffee size={16} className="text-orange-600 mr-1" />;
  };

  const renderOrdersList = (ordersList: Order[]) => {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No Orders</h3>
          <p className="text-sm text-gray-500">
            {activeTab === 'all' 
              ? 'You have no orders yet. They will appear here when customers place orders.'
              : `You have no ${activeTab} orders at the moment.`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {ordersList.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center">
                  {getServiceIcon(order.service_type)}
                  <h3 className="font-medium">{order.service_type === 'unishop' ? 'UniShop' : 'UniFood'}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Order #{order.id.slice(0, 8)} • {format(new Date(order.created_at), 'PP p')}
                </p>
              </div>
              <Badge className={getStatusColor(order.order_status)}>
                <span className="flex items-center">
                  {getStatusIcon(order.order_status)}
                  <span className="ml-1 capitalize">{order.order_status}</span>
                </span>
              </Badge>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium">{order.customer?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Item:</span>
                <span className="text-sm font-medium">
                  {order.service_type === 'unishop' 
                    ? order.products?.name || 'Unknown Product'
                    : order.food_items?.name || 'Unknown Food Item'}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Quantity:</span>
                <span className="text-sm">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-medium">${order.total_price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {order.order_status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {order.order_status === 'processing' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                >
                  Mark as Completed
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      );
    }
    
    if (activeTab === 'all') {
      const allOrders = [
        ...orders.pending,
        ...orders.processing, 
        ...orders.completed, 
        ...orders.cancelled
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return renderOrdersList(allOrders);
    }
    
    return renderOrdersList(orders[activeTab]);
  };

  // Calculate badge counts
  const pendingCount = orders.pending.length;
  const processingCount = orders.processing.length;
  const completedCount = orders.completed.length;
  const cancelledCount = orders.cancelled.length;

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="bg-[#003160] text-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag size={24} />
          <h1 className="text-xl font-bold">Orders</h1>
        </div>
        <p className="text-sm opacity-90">Manage your customer orders</p>
      </div>
      
      <div className="p-4">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as OrderStatus | 'all')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all" className="text-xs px-1">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-1 relative">
              Pending
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="processing" className="text-xs px-1 relative">
              Processing
              {processingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {processingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-1 relative">
              Completed
              {completedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {completedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs px-1 relative">
              Cancelled
              {cancelledCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {cancelledCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderTabContent()}
          </TabsContent>
          <TabsContent value="pending">
            {renderTabContent()}
          </TabsContent>
          <TabsContent value="processing">
            {renderTabContent()}
          </TabsContent>
          <TabsContent value="completed">
            {renderTabContent()}
          </TabsContent>
          <TabsContent value="cancelled">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>

      <SellerBottomNavigation />
    </div>
  );
} 