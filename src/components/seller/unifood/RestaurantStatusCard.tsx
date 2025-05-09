
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

interface RestaurantStatusCardProps {
  isRestaurantOpen: boolean;
  onToggleStatus: () => void;
}

const RestaurantStatusCard: React.FC<RestaurantStatusCardProps> = ({
  isRestaurantOpen,
  onToggleStatus
}) => {
  return (
    <div className="p-4 bg-white shadow-sm mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold">Restaurant Status</h2>
          <p className={`text-sm ${isRestaurantOpen ? 'text-green-600' : 'text-red-600'}`}>
            {isRestaurantOpen ? 'Open • Accepting Orders' : 'Closed • Not Accepting Orders'}
          </p>
        </div>
        <Switch 
          checked={isRestaurantOpen} 
          onCheckedChange={onToggleStatus}
        />
      </div>
    </div>
  );
};

export default RestaurantStatusCard;
