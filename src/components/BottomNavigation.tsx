import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => {
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

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [path, setPath] = useState(location.pathname);
  
  // Update the path state when location changes
  useEffect(() => {
    setPath(location.pathname);
  }, [location.pathname]);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-50 animate-fade-in">
      <NavItem 
        to="/" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === '/'}
      />
      <NavItem 
        to="/saved" 
        icon={<Bookmark size={20} strokeWidth={path === '/saved' ? 2.5 : 2} />} 
        label="Saved"
        isActive={path === '/saved'}
      />
      <NavItem 
        to="/history" 
        icon={<Clock size={20} strokeWidth={path === '/history' ? 2.5 : 2} />} 
        label="History" 
        isActive={path === '/history'}
      />
      <NavItem 
        to="/profile" 
        icon={<User size={20} strokeWidth={path === '/profile' ? 2.5 : 2} />} 
        label="Profile" 
        isActive={path === '/profile'}
      />
    </div>
  );
};

export default BottomNavigation;
