
import React from 'react';
import { Coffee } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <Coffee className="mx-auto text-gray-400 mb-2" size={32} />
      <h3 className="text-lg font-medium text-gray-700">No menu items yet</h3>
      <p className="text-gray-500 mb-4">Add your first menu item to start selling</p>
    </div>
  );
};

export default EmptyState;
