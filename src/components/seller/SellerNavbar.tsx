import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Clock, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
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

const SellerNavbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Determine if the current path belongs to uni food or uni shop
  const isUniFoodPath = path.includes('/seller/unifood');
  const isUniShopPath = path.includes('/seller/unishop');
  
  const dashboardPath = isUniShopPath 
    ? '/seller/unishop/dashboard' 
    : '/seller/unifood/dashboard';
  
  const ordersPath = '/seller/orders';
  const menuPath = isUniShopPath 
    ? '/seller/unishop/products' 
    : '/seller/unifood/menu';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50">
      <NavItem 
        to={dashboardPath} 
        icon={<Home size={20} />} 
        label="Dashboard" 
        isActive={path === dashboardPath}
      />
      <NavItem 
        to={menuPath} 
        icon={<Menu size={20} />} 
        label={isUniShopPath ? "Products" : "Menu"} 
        isActive={path === menuPath}
      />
      <NavItem 
        to={ordersPath} 
        icon={<ShoppingBag size={20} />} 
        label="Orders" 
        isActive={path === ordersPath}
      />
      <NavItem 
        to="/profile" 
        icon={<User size={20} />} 
        label="Profile" 
        isActive={path === '/profile'}
      />
    </div>
  );
};

export default SellerNavbar; 