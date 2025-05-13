import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

const DriverUniSend: React.FC = () => {
  const navigate = useNavigate();
  
  // Redirect to the consolidated UniMove page
  useEffect(() => {
    navigate('/driver/unimove', { replace: true });
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">
          UniSend has been integrated with UniMove for a better experience.
        </p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003160] mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default DriverUniSend;
