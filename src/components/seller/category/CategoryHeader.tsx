
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CategoryHeaderProps {
  isAdding: boolean;
  onAdd: () => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  isAdding,
  onAdd
}) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Product Categories</h3>
      {!isAdding && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onAdd}
          className="flex items-center gap-1"
        >
          <Plus size={14} />
          <span>Add</span>
        </Button>
      )}
    </div>
  );
};

export default CategoryHeader;
