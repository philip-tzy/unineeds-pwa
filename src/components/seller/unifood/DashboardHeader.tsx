
import React from 'react';
import { Coffee } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string | undefined;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <header className="bg-[#003160] text-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Food Seller Dashboard</h1>
          <p className="text-sm opacity-80">Welcome back, {userName}</p>
        </div>
        <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
          <Coffee className="text-[#003160]" size={20} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
