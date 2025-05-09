import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ShoppingBag, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

interface SellerBottomNavigationProps {
  sellerType: 'unishop' | 'unifood';
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => {
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
        "flex flex-1 flex-col items-center justify-center space-y-1 transition-all duration-200",
        isActive ? "text-[#9b87f5]" : "text-gray-500"
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

const SellerBottomNavigation: React.FC<SellerBottomNavigationProps> = ({ sellerType }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [path, setPath] = useState(location.pathname);
  
  const basePath = sellerType === 'unishop' ? '/seller/unishop' : '/seller/unifood';
  
  // Update the path state when location changes
  useEffect(() => {
    setPath(location.pathname);
  }, [location.pathname]);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50 animate-fade-in">
      <NavItem 
        to={`${basePath}/dashboard`} 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === `${basePath}/dashboard`}
      />
      <NavItem 
        to="/seller/orders" 
        icon={<Package size={20} />} 
        label="Orders" 
        isActive={path === `/seller/orders` || path === `${basePath}/orders`}
      />
      <NavItem 
        to={sellerType === 'unishop' ? `${basePath}/products` : `${basePath}/menu`} 
        icon={<ShoppingBag size={20} />} 
        label="Products" 
        isActive={path.includes(`${basePath}/products`) || path.includes(`${basePath}/menu`)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-1 flex-col items-center justify-center space-y-1 transition-all duration-200 text-gray-500">
          <div className={cn(
            "transition-transform duration-300",
            path === '/profile' ? "scale-110" : "scale-100"
          )}>
            <User size={20} />
          </div>
          <span className="text-[10px] font-medium">Account</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer w-full">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SellerBottomNavigation;
