import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Clock, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SellerNavbar from '@/components/seller/SellerNavbar';

export default function OrdersPage() {
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
    fetchOrders();
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('*, products(*)')
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
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchOrders(); // Refresh all orders when any changes
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoading(true);
      
      // Update order status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (orderError) throw orderError;

      if (newStatus === 'completed') {
        // Add to customer history for completed orders
        const { error: historyError } = await supabase
          .from('customer_history')
          .insert([
            {
              customer_id: orderData.customer_id,
              order_id: orderId,
              action: 'order_completed',
              details: {
                order_status: 'completed',
                total_price: orderData.total_price,
                completed_at: new Date().toISOString()
              }
            }
          ]);

        if (historyError) {
          console.error('Error adding to customer history:', historyError);
        }

        // Create notification for customer
        const { error: notifError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: orderData.customer_id,
              type: 'order_completed',
              title: 'Order Completed',
              message: `Your order #${orderId.slice(0, 8)} has been completed.`,
              is_read: false,
              data: { order_id: orderId }
            }
          ]);

        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
      } else if (newStatus === 'cancelled') {
        // Add to customer history for cancelled orders
        const { error: historyError } = await supabase
          .from('customer_history')
          .insert([
            {
              customer_id: orderData.customer_id,
              order_id: orderId,
              action: 'order_cancelled',
              details: {
                order_status: 'cancelled',
                total_price: orderData.total_price,
                cancelled_at: new Date().toISOString()
              }
            }
          ]);

        if (historyError) {
          console.error('Error adding to customer history:', historyError);
        }

        // Create notification for customer about cancellation
        const { error: notifError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: orderData.customer_id,
              type: 'order_cancelled',
              title: 'Order Cancelled',
              message: `Your order #${orderId.slice(0, 8)} has been cancelled.`,
              is_read: false,
              data: { order_id: orderId }
            }
          ]);

        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }
      
      const statusMessages = {
        pending: 'Order marked as pending',
        processing: 'Order accepted and processing',
        completed: 'Order completed successfully',
        cancelled: 'Order cancelled'
      };
      
      toast.success(statusMessages[newStatus]);
      
      // Orders will be refreshed automatically through real-time subscription
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
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
        return <Clock size={16} className="text-yellow-500" />;
      case 'processing':
        return <ShoppingBag size={16} className="text-blue-500" />;
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'cancelled':
        return <X size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} />;
    }
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
                <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                <p className="text-xs text-gray-500">
                  {format(new Date(order.created_at), 'PPp')}
                </p>
              </div>
              <Badge className={getStatusColor(order.order_status)}>
                <span className="flex items-center">
                  {getStatusIcon(order.order_status)}
                  <span className="ml-1">{order.order_status}</span>
                </span>
              </Badge>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Product:</span>
                <span className="text-sm font-medium">{order.products?.name || 'Unknown Product'}</span>
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
                    className="bg-[#9b87f5] hover:bg-[#8d79e6]"
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600"
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
          <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-t-transparent rounded-full mx-auto mb-4"></div>
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
    <div className="pb-20">
      <div className="bg-[#9b87f5] text-white p-4">
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
          
          <TabsContent value={activeTab}>
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>

      <SellerNavbar />
    </div>
  );
} 