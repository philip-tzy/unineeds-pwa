
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Bell } from 'lucide-react';
import DashboardStats from '@/components/seller/DashboardStats';
import SellerBottomNavigation from '@/components/seller/BottomNavigation';
import { FoodItem } from '@/types/food';
import { getSellerOrders, updateOrderStatus } from '@/services/food/FoodOrderService';
import { subscribeToNewOrders, subscribeToOrderStatusChanges } from '@/services/food/NotificationService';
import DashboardHeader from '@/components/seller/unifood/DashboardHeader';
import RestaurantStatusCard from '@/components/seller/unifood/RestaurantStatusCard';
import QuickNavigation from '@/components/seller/unifood/QuickNavigation';
import MenuItemsSection from '@/components/seller/unifood/MenuItemsSection';
import ActiveOrdersList from '@/components/seller/unifood/ActiveOrdersList';
import NotificationsPanel from '@/components/seller/unifood/NotificationsPanel';
import { Button } from '@/components/ui/button';

interface OrderSummary {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: string;
}

const UniFoodSellerDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [activeOrders, setActiveOrders] = useState<OrderSummary[]>([]);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    pendingOrders: 0,
    customerCount: 0
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the seller dashboard",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    // Fetch initial orders
    if (user) {
      fetchOrders();
    }
  }, [isAuthenticated, navigate, toast, user]);
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to new orders
    const unsubscribeNewOrders = subscribeToNewOrders(user.id, (newOrder) => {
      // Update the active orders list
      fetchOrders();
      
      // Increment unread notifications count
      setUnreadNotificationsCount(count => count + 1);
    });
    
    // Subscribe to order status changes
    const unsubscribeStatusChanges = subscribeToOrderStatusChanges(user.id, (updatedOrder) => {
      // Update the active orders list
      fetchOrders();
    });
    
    return () => {
      unsubscribeNewOrders();
      unsubscribeStatusChanges();
    };
  }, [user]);
  
  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getSellerOrders(user.id);
      
      if (error) throw error;
      
      if (data) {
        // Format orders for the component
        const ordersFormatted = data
          .filter(order => ['pending', 'preparing', 'ready for pickup'].includes(order.status.toLowerCase()))
          .map(order => ({
            id: order.id,
            customer: `Customer #${order.customer_id.substring(0, 4)}`,
            items: order.order_items?.length || 0,
            total: order.total_amount,
            status: order.status.charAt(0).toUpperCase() + order.status.slice(1)
          }));
        
        setActiveOrders(ordersFormatted);
        
        // Update stats
        setStats({
          totalSales: data.reduce((sum, order) => sum + order.total_amount, 0),
          orderCount: data.length,
          pendingOrders: data.filter(order => ['pending', 'preparing', 'ready for pickup'].includes(order.status.toLowerCase())).length,
          customerCount: new Set(data.map(order => order.customer_id)).size
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const handleToggleRestaurantStatus = () => {
    setIsRestaurantOpen(!isRestaurantOpen);
    toast({
      title: `Restaurant ${!isRestaurantOpen ? 'Open' : 'Closed'}`,
      description: `You are now ${!isRestaurantOpen ? 'accepting' : 'not accepting'} orders`,
    });
  };
  
  const handleAddItemClick = () => {
    setIsAddingItem(true);
  };
  
  const handleCancelAddItem = () => {
    setIsAddingItem(false);
  };
  
  const handleItemAdded = () => {
    setIsAddingItem(false);
  };
  
  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    toast({
      title: "Coming Soon",
      description: "Item editing will be available in a future update",
    });
  };
  
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { success, error } = await updateOrderStatus(orderId, newStatus);
      
      if (!success) throw error;
      
      // Optimistically update UI
      setActiveOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        ).filter(order => 
          newStatus.toLowerCase() !== 'completed' || order.id !== orderId
        )
      );
      
      toast({
        title: "Order Updated",
        description: `Order #${orderId.substring(0, 8)} marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const navigateToMenu = () => {
    navigate('/seller/unifood/menu');
  };
  
  const toggleNotificationsPanel = () => {
    setIsNotificationsPanelOpen(!isNotificationsPanelOpen);
    if (!isNotificationsPanelOpen) {
      // Reset unread count when opening the panel
      setUnreadNotificationsCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="relative">
        <DashboardHeader userName={user?.name} />
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-4 top-4"
          onClick={toggleNotificationsPanel}
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </Button>
      </div>
      
      <RestaurantStatusCard 
        isRestaurantOpen={isRestaurantOpen}
        onToggleStatus={handleToggleRestaurantStatus}
      />
      
      <div className="p-4">
        <DashboardStats 
          totalSales={stats.totalSales}
          orderCount={stats.orderCount} 
          pendingOrders={stats.pendingOrders}
          customerCount={stats.customerCount}
          refreshTrigger={activeOrders.length} 
        />
      </div>
      
      <QuickNavigation onMenuClick={navigateToMenu} />
      
      <MenuItemsSection
        isAddingItem={isAddingItem}
        onAddItemClick={handleAddItemClick}
        onCancelAddItem={handleCancelAddItem}
        onItemAdded={handleItemAdded}
        onEditItem={handleEditItem}
      />
      
      <ActiveOrdersList 
        orders={activeOrders}
        onOrderStatusChange={handleOrderStatusChange}
      />
      
      <NotificationsPanel 
        isOpen={isNotificationsPanelOpen}
        onClose={toggleNotificationsPanel}
      />
      
      <SellerBottomNavigation sellerType="unifood" />
    </div>
  );
};

export default UniFoodSellerDashboard;
