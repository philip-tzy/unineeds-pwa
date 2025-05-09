
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MenuPageHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-[#003160] text-white p-4 shadow-sm">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/seller/unifood/dashboard')} 
          className="p-1 rounded-full hover:bg-[#002040] transition-colors mr-2"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Manage Menu</h1>
      </div>
    </header>
  );
};

export default MenuPageHeader;
