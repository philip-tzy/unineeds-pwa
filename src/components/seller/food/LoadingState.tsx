
import React from 'react';
import { Coffee } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <Coffee className="animate-pulse text-gray-400 mr-2" />
      <span>Loading menu items...</span>
    </div>
  );
};

export default LoadingState;
