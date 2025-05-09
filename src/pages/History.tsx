import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Clock, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BottomNavigation from '@/components/BottomNavigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HistoryItem {
  id: string;
  customer_id: string;
  order_id: string;
  action: string;
  details: any;
  created_at: string;
  order?: {
    id: string;
    product_id: string;
    seller_id: string;
    quantity: number;
    total_price: number;
    order_status: string;
    created_at: string;
    products?: {
      name: string;
    }
  }
}

const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<{
    completed: HistoryItem[];
    cancelled: HistoryItem[];
    processing: HistoryItem[];
    pending: HistoryItem[];
  }>({
    completed: [],
    cancelled: [],
    processing: [],
    pending: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('completed');
  
  useEffect(() => {
    if (user) {
      fetchHistory();
      const unsubscribe = setupRealtimeSubscription();
      return () => unsubscribe();
    }
  }, [user]);
  
  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get all orders directly
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Get customer history records
      const { data: historyData, error: historyError } = await supabase
        .from('customer_history')
        .select('*, order:orders(*, products(*))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (historyError) throw historyError;
      
      // Create a map of order IDs to their most recent history entry
      const historyMap = new Map();
      (historyData || []).forEach(item => {
        historyMap.set(item.order_id, item);
      });
      
      // Process all orders
      const allHistoryItems: HistoryItem[] = (ordersData || []).map(order => {
        // If we have a history entry for this order, use that
        if (historyMap.has(order.id)) {
          return historyMap.get(order.id);
        }
        
        // Otherwise create a synthetic history item from the order
        return {
          id: `auto-${order.id}`,
          customer_id: order.customer_id,
          order_id: order.id,
          action: `order_${order.order_status}`,
          details: {
            order_status: order.order_status,
            total_price: order.total_price,
            updated_at: order.updated_at || order.created_at
          },
          created_at: order.updated_at || order.created_at,
          order: order
        };
      });
      
      // Group by status
      const groupedHistory = {
        completed: allHistoryItems.filter(item => 
          item.action === 'order_completed' || 
          (item.order && item.order.order_status === 'completed')
        ),
        cancelled: allHistoryItems.filter(item => 
          item.action === 'order_cancelled' || 
          (item.order && item.order.order_status === 'cancelled')
        ),
        processing: allHistoryItems.filter(item => 
          item.order && item.order.order_status === 'processing'
        ),
        pending: allHistoryItems.filter(item => 
          item.order && item.order.order_status === 'pending'
        )
      };
      
      setHistory(groupedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };
  
  const setupRealtimeSubscription = () => {
    const historySubscription = supabase
      .channel('customer_history_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customer_history' },
        () => fetchHistory()
      )
      .subscribe();
      
    const ordersSubscription = supabase
      .channel('customer_orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchHistory()
      )
      .subscribe();
      
    return () => {
      historySubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  };
  
  const getActionText = (item: HistoryItem) => {
    if (item.action === 'order_completed') return 'Order Completed';
    if (item.action === 'order_cancelled') return 'Order Cancelled';
    
    if (item.order) {
      switch (item.order.order_status) {
        case 'completed': return 'Order Completed';
        case 'cancelled': return 'Order Cancelled';
        case 'processing': return 'Order Processing';
        case 'pending': return 'Order Pending';
        default: return 'Order Updated';
      }
    }
    
    return 'Order Updated';
  };
  
  const getStatusBadge = (item: HistoryItem) => {
    const status = item.action?.replace('order_', '') || item.order?.order_status || 'unknown';
    
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <span className="flex items-center">
              <Check size={14} className="mr-1" />
              Completed
            </span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800">
            <span className="flex items-center">
              <X size={14} className="mr-1" />
              Cancelled
            </span>
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <span className="flex items-center">
              <ShoppingBag size={14} className="mr-1" />
              Processing
            </span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <span className="flex items-center">
              <Clock size={14} className="mr-1" />
              Pending
            </span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <span className="flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Unknown
            </span>
          </Badge>
        );
    }
  };
  
  const getActionIcon = (item: HistoryItem) => {
    const status = item.action?.replace('order_', '') || item.order?.order_status || 'unknown';
    
    switch (status) {
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'cancelled':
        return <X size={16} className="text-red-500" />;
      case 'processing':
        return <ShoppingBag size={16} className="text-blue-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };
  
  const renderHistoryContent = (items: HistoryItem[]) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#9b87f5] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-500">Loading your history...</p>
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock size={48} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders found</h2>
          <p className="text-gray-500">
            Your {activeTab} orders will appear here
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                {getActionIcon(item)}
                <span className="ml-2 font-medium">{getActionText(item)}</span>
              </div>
              {getStatusBadge(item)}
            </div>
            
            <div className="text-sm text-gray-500 mb-3">
              {format(new Date(item.created_at), 'PPp')}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="text-sm">#{item.order_id.slice(0, 8)}</span>
              </div>
              
              {item.order?.products && (
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Product:</span>
                  <span className="text-sm font-medium">{item.order.products.name}</span>
                </div>
              )}
              
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Quantity:</span>
                <span className="text-sm">{item.order?.quantity || '-'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-medium">
                  ${(item.details?.total_price || item.order?.total_price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // Calculate badge counts
  const completedCount = history.completed.length;
  const cancelledCount = history.cancelled.length;
  const processingCount = history.processing.length;
  const pendingCount = history.pending.length;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">Order History</h1>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>
      
      {/* Content */}
      <main className="container p-4">
        <Tabs defaultValue="completed" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full mb-4">
            <TabsTrigger value="completed" className="relative">
              Completed
              {completedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {completedCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="processing" className="relative">
              Processing
              {processingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {processingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="relative">
              Cancelled
              {cancelledCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                  {cancelledCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="completed">
            {renderHistoryContent(history.completed)}
          </TabsContent>
          
          <TabsContent value="processing">
            {renderHistoryContent(history.processing)}
          </TabsContent>
          
          <TabsContent value="pending">
            {renderHistoryContent(history.pending)}
          </TabsContent>
          
          <TabsContent value="cancelled">
            {renderHistoryContent(history.cancelled)}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default History;
