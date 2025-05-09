import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Mail, User, LogOut } from 'lucide-react';
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
import { freelancerServices } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick, badge }) => {
  const content = (
    <>
      <div className={cn(
        "transition-transform duration-300 relative",
        isActive ? "scale-110" : "scale-100"
      )}>
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </>
  );
  
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-col items-center justify-center space-y-1 transition-all duration-200",
          isActive ? "text-[#9b87f5]" : "text-gray-500"
        )}
      >
        {content}
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
      {content}
    </Link>
  );
};

const FreelancerBottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [path, setPath] = useState(location.pathname);
  const [pendingOffers, setPendingOffers] = useState(0);
  
  // Update the path state when location changes
  useEffect(() => {
    setPath(location.pathname);
  }, [location.pathname]);
  
  // Fetch pending offers count and set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    const fetchPendingOffers = async () => {
      try {
        const offersData = await freelancerServices.getServiceOffers(user.id);
        if (offersData) {
          const pendingCount = offersData.filter(offer => offer.status === 'pending').length;
          setPendingOffers(pendingCount);
        }
      } catch (error) {
        console.error('Error fetching pending offers:', error);
      }
    };
    
    fetchPendingOffers();
    
    // Set up real-time subscription for offer updates
    const subscription = supabase
      .channel(`freelancer-offers-${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_offers',
          filter: `freelancer_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh the pending count
          fetchPendingOffers();
          
          // Show notification for new offers
          if (payload.eventType === 'INSERT') {
            const newOffer = payload.new as any;
            if (newOffer.status === 'pending') {
              toast({
                title: "New Service Offer",
                description: "You have received a new service offer",
              });
            }
          }
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);
  
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
        to="/freelancer/dashboard" 
        icon={<Home size={20} />} 
        label="Home" 
        isActive={path === '/freelancer/dashboard'}
      />
      <NavItem 
        to="/freelancer/jobs" 
        icon={<Briefcase size={20} />} 
        label="Jobs" 
        isActive={path === '/freelancer/jobs'}
      />
      <NavItem 
        to="/freelancer/offers" 
        icon={<Mail size={20} />} 
        label="Offers" 
        isActive={path === '/freelancer/offers'}
        badge={pendingOffers}
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
          <DropdownMenuItem asChild>
            <Link to="/freelancer/skills" className="cursor-pointer w-full">Manage Skills</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/freelancer/services" className="cursor-pointer w-full">Manage Services</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FreelancerBottomNavigation;
