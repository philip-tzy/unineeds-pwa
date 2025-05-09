
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, X, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  editName: string;
  selectedCategoryId: string | null;
  onSelect: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isEditing,
  editName,
  selectedCategoryId,
  onSelect,
  onEdit,
  onDelete,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit
}) => {
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded-md border ${
        selectedCategoryId === category.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
    >
      {isEditing ? (
        <div className="flex gap-2 w-full">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={onSaveEdit}>
            <Check size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCancelEdit}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelect(category.id)}
            className="flex-1 text-left"
          >
            {category.name}
          </button>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
            >
              <Edit size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryItem;
