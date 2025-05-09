
import React from 'react';
import { 
  Utensils, 
  List, 
  BarChart3, 
  DollarSign 
} from 'lucide-react';

interface QuickNavigationProps {
  onMenuClick: () => void;
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({
  onMenuClick
}) => {
  return (
    <div className="p-4 bg-white shadow-sm">
      <div className="grid grid-cols-4 gap-2 text-center">
        <button 
          className="flex flex-col items-center justify-center space-y-1"
          onClick={onMenuClick}
        >
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
            <Utensils size={20} className="text-[#003160]" />
          </div>
          <span className="text-xs">Menu</span>
        </button>
        <button className="flex flex-col items-center justify-center space-y-1">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
            <List size={20} className="text-[#003160]" />
          </div>
          <span className="text-xs">Orders</span>
        </button>
        <button className="flex flex-col items-center justify-center space-y-1">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
            <BarChart3 size={20} className="text-[#003160]" />
          </div>
          <span className="text-xs">Analytics</span>
        </button>
        <button className="flex flex-col items-center justify-center space-y-1">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-[#003160]" />
          </div>
          <span className="text-xs">Earnings</span>
        </button>
      </div>
    </div>
  );
};

export default QuickNavigation;
