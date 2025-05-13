import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => {
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-col items-center justify-center space-y-1",
          isActive ? "text-[#003160]" : "text-gray-500"
        )}
      >
        <div className={cn(
          "transition-transform duration-300",
          isActive ? "scale-110" : "scale-100"
        )}>
          {icon}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  }
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-1 flex-col items-center justify-center space-y-1",
        isActive ? "text-[#003160]" : "text-gray-500"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        isActive ? "scale-110" : "scale-100"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
};

const SellerBottomNavigation: React.FC = () => {
  const location = useLocation();
  const [path, setPath] = useState(location.pathname);
  
  console.log('SellerBottomNavigation rendering with path:', location.pathname);
  
  // Update the path state when location changes
  useEffect(() => {
    console.log('Location changed to:', location.pathname);
    setPath(location.pathname);
  }, [location.pathname]);
  
  // Determine if we're on a profile page
  const isProfileActive = path.includes('/seller/profile');
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50">
      <NavItem 
        to="/seller/dashboard" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === '/seller/dashboard'}
      />
      <NavItem 
        to="/seller/orders" 
        icon={<Package size={20} />} 
        label="Orders" 
        isActive={path.includes('/seller/orders')}
      />
      <NavItem 
        to="/seller/profile" 
        icon={<User size={20} />} 
        label="Account" 
        isActive={isProfileActive}
      />
    </div>
  );
};

export default SellerBottomNavigation;
