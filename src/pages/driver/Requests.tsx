import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bike, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { fetchPendingOrders, saveDeclinedOrder, getDeclinedOrders } from '@/services/driver/OrderRepository';
import { subscribeToNewOrders } from '@/services/driver/OrderSubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/types/unimove';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RequestCard: React.FC<{
  order: Order;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
}> = ({ order, onAccept, onDecline }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-100">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          {order.service_type === 'unimove' ? (
            <Bike size={20} className="text-[#003160]" />
          ) : (
            <Package size={20} className="text-[#003160]" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{order.service_type === 'unimove' ? 'Ride Request' : 'Delivery Request'}</h3>
          <p className="text-xs text-gray-500">
            ID: {order.id.substring(0, 8)}... • {new Date(order.created_at || '').toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">${order.total_amount.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-start mb-2">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm font-medium">{order.pickup_address}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mr-2 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="text-sm font-medium">{order.delivery_address}</p>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={() => onAccept(order)}
          className="flex-1 bg-[#003160] hover:bg-[#002140]"
        >
          Accept
        </Button>
        <Button 
          onClick={() => onDecline(order)}
          variant="outline"
          className="flex-1"
        >
          Decline
        </Button>
      </div>
    </div>
  );
};

const DriverRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch pending orders
  useEffect(() => {
    if (!user?.id) return;
    
    console.log("Setting up driver requests page with user ID:", user.id);
    
    const loadPendingOrders = async () => {
      try {
        setLoading(true);
        // Pass the driver ID to filter out declined orders
        const orders = await fetchPendingOrders(user.id);
        console.log("Loaded pending orders:", orders.length, orders);
        setPendingOrders(orders);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
        toast({
          title: "Error",
          description: "Failed to load ride requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPendingOrders();
    
    // Set up periodic refresh timer for orders
    const refreshInterval = setInterval(() => {
      console.log("Periodic refresh of pending orders");
      loadPendingOrders();
    }, 30000); // Refresh every 30 seconds
    
    // Subscribe to new orders
    const subscription = subscribeToNewOrders(async (newOrder) => {
      console.log("New order received in subscription:", newOrder);
      
      // Check if this order has been declined before adding it using the proper function
      // that checks both localStorage and database
      const declinedOrderIds = await getDeclinedOrders(user.id);
      console.log("Declined order IDs:", declinedOrderIds);
      
      if (!declinedOrderIds.includes(newOrder.id)) {
        // Check if the order is already in our list
        setPendingOrders(current => {
          if (current.some(o => o.id === newOrder.id)) {
            console.log("Order already in list, not adding:", newOrder.id);
            return current;
          }
          console.log("Adding new order to list:", newOrder.id);
          return [...current, newOrder];
        });
        
        toast({
          title: "New Request",
          description: `New ${newOrder.service_type} request available!`,
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      } else {
        console.log("Order was previously declined, not adding:", newOrder.id);
      }
    }, user.id);
    
    return () => {
      console.log("Cleaning up driver requests page subscriptions");
      clearInterval(refreshInterval);
      // Use the new unsubscribe method
      subscription.unsubscribe();
    };
  }, [user?.id, toast]);
  
  const handleAccept = async (order: Order) => {
    navigate(order.service_type === 'unimove' 
      ? '/driver/unimove' 
      : '/driver/unisend', 
      { state: { order } }
    );
  };
  
  const handleDecline = async (order: Order) => {
    if (!user?.id) return;
    
    // Remove the order from the local state
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    
    // Save the declined order to prevent it from showing up again
    const { error } = await saveDeclinedOrder(order.id, user.id);
    
    if (error) {
      console.error('Error saving declined order:', error);
    }
    
    toast({
      title: "Request Declined",
      description: "You've declined this request",
    });
  };
  
  // Filter orders by type based on active tab
  const filteredOrders = pendingOrders.filter(order => {
    if (activeTab === "all") return true;
    return order.service_type.toLowerCase() === activeTab;
  });
  
  // Count orders by type
  const rideCount = pendingOrders.filter(o => o.service_type === 'unimove').length;
  const deliveryCount = pendingOrders.filter(o => o.service_type === 'unisend').length;
  
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
        <h1 className="flex-1 text-center text-xl font-bold">
          <span className="text-[#003160]">Requests</span>
        </h1>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">
              All
              {pendingOrders.length > 0 && (
                <span className="ml-1 text-xs bg-[#003160] text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unimove">
              Rides
              {rideCount > 0 && (
                <span className="ml-1 text-xs bg-[#003160] text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {rideCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unisend">
              Deliveries
              {deliveryCount > 0 && (
                <span className="ml-1 text-xs bg-[#003160] text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {deliveryCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {loading ? (
              <div className="text-center py-10">
                <p>Loading requests...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div>
                {filteredOrders.map(order => (
                  <RequestCard 
                    key={order.id} 
                    order={order} 
                    onAccept={handleAccept} 
                    onDecline={handleDecline} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No pending requests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unimove" className="mt-0">
            {loading ? (
              <div className="text-center py-10">
                <p>Loading ride requests...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div>
                {filteredOrders.map(order => (
                  <RequestCard 
                    key={order.id} 
                    order={order} 
                    onAccept={handleAccept} 
                    onDecline={handleDecline} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No pending ride requests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unisend" className="mt-0">
            {loading ? (
              <div className="text-center py-10">
                <p>Loading delivery requests...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div>
                {filteredOrders.map(order => (
                  <RequestCard 
                    key={order.id} 
                    order={order} 
                    onAccept={handleAccept} 
                    onDecline={handleDecline} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No pending delivery requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverRequestsPage; 