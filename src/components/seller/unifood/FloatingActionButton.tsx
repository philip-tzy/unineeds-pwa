
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ isVisible, onClick }) => {
  if (!isVisible) return null;
  
  return (
    <Button
      className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg bg-[#003160] hover:bg-[#002040]"
      onClick={onClick}
    >
      <Plus size={24} />
    </Button>
  );
};

export default FloatingActionButton;
