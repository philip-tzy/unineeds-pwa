
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';

const DriverUniSend: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">
          <span className="text-[#9b87f5]">Uni</span>
          <span className="text-black">Send</span>
          <span className="text-[#9b87f5]"> Driver</span>
        </h1>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={24} />
        </button>
      </div>
      
      {/* Content area */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">Delivery Requests</h2>
          
          {/* Placeholder for delivery requests */}
          <div className="text-center py-8">
            <p className="text-gray-500">No delivery requests available</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverUniSend;
