import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bell, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { fetchPendingOrders } from '@/services/driver/OrderRepository';
import { fetchPendingDeliveryOrders } from '@/services/driver/UniSendOrderRepository';
import { subscribeToNewOrders } from '@/services/driver/OrderSubscriptionService';
import { subscribeToNewDeliveryOrders } from '@/services/driver/UniSendSubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, badge, onClick }) => {
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-col items-center justify-center space-y-1 transition-all duration-200",
          isActive ? "text-[#003160]" : "text-gray-500"
        )}
      >
        <div className={cn(
          "transition-transform duration-300 relative",
          isActive ? "scale-110" : "scale-100"
        )}>
          {icon}
          {badge && badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  }
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-1 flex-col items-center justify-center space-y-1 transition-all duration-200",
        isActive ? "text-[#003160]" : "text-gray-500"
      )}
    >
      <div className={cn(
        "transition-transform duration-300 relative",
        isActive ? "scale-110" : "scale-100"
      )}>
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};

const DriverBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [path, setPath] = useState(location.pathname);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Update the path state when location changes
  useEffect(() => {
    setPath(location.pathname);
    
    // Debug logging for profile navigation
    if (location.pathname.includes('/driver/profile')) {
      console.log('Driver accessing profile page');
      console.log('Current user:', user);
      console.log('Current path:', location.pathname);
    }
  }, [location.pathname, user]);
  
  // Fetch pending orders count and subscribe to new orders
  useEffect(() => {
    if (!user?.id) return;
    
    console.log(`Initializing BottomNavigation notifications for driver ${user.id}`);
    
    const loadPendingOrders = async () => {
      try {
        // Get both ride and delivery pending orders
        const rideOrders = await fetchPendingOrders(user.id);
        const deliveryOrders = await fetchPendingDeliveryOrders(user.id);
        
        // Combine the counts
        const totalPendingCount = rideOrders.length + deliveryOrders.length;
        setPendingRequestsCount(totalPendingCount);
        
        console.log(`Found ${rideOrders.length} pending ride orders and ${deliveryOrders.length} pending delivery orders`);
      } catch (error) {
        console.error('Error fetching pending orders count:', error);
      }
    };
    
    // Initial load
    loadPendingOrders();
    
    // Subscribe to new ride orders
    const rideChannel = subscribeToNewOrders((newOrder) => {
      console.log('New ride notification in bottom navigation:', newOrder);
      
      // Only update count if not on the orders page
      if (!path.includes('/driver/unimove')) {
        setPendingRequestsCount(prev => prev + 1);
        
        // Show toast notification for new ride request
        toast({
          title: "New Ride Request",
          description: `New ride from ${newOrder.pickup_address || 'pickup'} to ${newOrder.delivery_address || 'destination'}`,
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      }
    });
    
    // Subscribe to new delivery orders
    const deliveryChannel = subscribeToNewDeliveryOrders((newOrder) => {
      console.log('New delivery notification in bottom navigation:', newOrder);
      
      // Only update count if not on the orders page
      if (!path.includes('/driver/unimove')) {
        setPendingRequestsCount(prev => prev + 1);
        
        // Show toast notification for new delivery request
        toast({
          title: "New Delivery Request",
          description: `New delivery from ${newOrder.pickup_address || 'pickup'} to ${newOrder.delivery_address || 'destination'}`,
        });
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      }
    });
    
    // Refresh count every 30 seconds as a fallback
    const intervalId = setInterval(() => {
      console.log('Polling for pending orders count...');
      if (!path.includes('/driver/unimove')) {
        loadPendingOrders();
      }
    }, 30000);
    
    return () => {
      if (rideChannel.unsubscribe) rideChannel.unsubscribe();
      if (deliveryChannel.unsubscribe) deliveryChannel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user?.id, path, toast]);
  
  // Reset badge count when navigating to the UniMove page
  useEffect(() => {
    if (path.includes('/driver/unimove')) {
      setPendingRequestsCount(0);
    }
  }, [path]);
  
  // Handle navigation to requests
  const handleRequestsClick = () => {
    navigate('/driver/unimove');
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50 animate-fade-in">
      <NavItem 
        to="/driver/dashboard" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === '/driver/dashboard'}
      />
      <NavItem 
        to="/driver/unimove" 
        icon={<Bell size={20} />} 
        label="Requests" 
        isActive={path.includes('/driver/unimove')}
        badge={pendingRequestsCount}
        onClick={handleRequestsClick}
      />
      <NavItem 
        to="/driver/earnings" 
        icon={<DollarSign size={20} />} 
        label="Earnings" 
        isActive={path.includes('/driver/earnings')}
      />
      <NavItem 
        to="/driver/profile" 
        icon={<User size={20} />} 
        label="Profile" 
        isActive={path.includes('/profile')}
      />
    </div>
  );
};

export default DriverBottomNavigation;
