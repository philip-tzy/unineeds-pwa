
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, Minus } from 'lucide-react';

interface StockEditorProps {
  initialStock: number;
  onSave: (newStock: number) => void;
  onCancel: () => void;
}

const StockEditor: React.FC<StockEditorProps> = ({ initialStock, onSave, onCancel }) => {
  const [stock, setStock] = useState(initialStock);
  
  const handleIncrement = () => {
    setStock(prev => prev + 1);
  };
  
  const handleDecrement = () => {
    setStock(prev => Math.max(0, prev - 1));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setStock(value);
    } else if (e.target.value === '') {
      setStock(0);
    }
  };
  
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center border rounded-md">
        <button
          type="button"
          onClick={handleDecrement}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <Minus size={14} />
        </button>
        
        <input
          type="text"
          value={stock}
          onChange={handleChange}
          className="w-12 text-center text-sm border-0 focus:ring-0"
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <Plus size={14} />
        </button>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full text-green-600"
        onClick={() => onSave(stock)}
      >
        <Check size={14} />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full text-red-600"
        onClick={onCancel}
      >
        <X size={14} />
      </Button>
    </div>
  );
};

export default StockEditor;
