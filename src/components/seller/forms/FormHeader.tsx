
import React from 'react';
import { X } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  onCancel: () => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, onCancel }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button 
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default FormHeader;
