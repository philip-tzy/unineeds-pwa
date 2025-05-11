import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Bell, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { fetchPendingOrders } from '@/services/driver/OrderRepository';
import { subscribeToNewOrders } from '@/services/driver/OrderSubscriptionService';
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
          isActive ? "text-[#9b87f5]" : "text-gray-500"
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
        isActive ? "text-[#9b87f5]" : "text-gray-500"
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
  }, [location.pathname]);
  
  // Fetch pending orders count and subscribe to new orders
  useEffect(() => {
    if (!user?.id) return;
    
    const loadPendingOrders = async () => {
      try {
        const orders = await fetchPendingOrders();
        setPendingRequestsCount(orders.length);
      } catch (error) {
        console.error('Error fetching pending orders count:', error);
      }
    };
    
    loadPendingOrders();
    
    // Subscribe to new orders to update badge count
    const channel = subscribeToNewOrders((newOrder) => {
      setPendingRequestsCount(prev => prev + 1);
      
      // Play notification sound if not on the requests page
      if (!path.includes('/driver/requests')) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Auto-play prevented:', e));
        } catch (e) {
          console.log('Audio notification not supported');
        }
      }
    });
    
    // Refresh count every 30 seconds
    const intervalId = setInterval(loadPendingOrders, 30000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [user?.id, path]);
  
  // Reset badge count when navigating to requests page
  useEffect(() => {
    if (path.includes('/driver/requests')) {
      setPendingRequestsCount(0);
    }
  }, [path]);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50 animate-fade-in">
      <NavItem 
        to="/driver/dashboard" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === '/driver/dashboard'}
      />
      <NavItem 
        to="/driver/requests" 
        icon={<Bell size={20} />} 
        label="Requests" 
        isActive={path.includes('/driver/requests')}
        badge={pendingRequestsCount}
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
        isActive={path.includes('/driver/profile')}
      />
    </div>
  );
};

export default DriverBottomNavigation;
