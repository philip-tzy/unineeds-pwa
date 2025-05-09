
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface AddCategoryFormProps {
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleAddCategory: () => void;
  onCancel: () => void;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  newCategoryName,
  setNewCategoryName,
  handleAddCategory,
  onCancel
}) => {
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Category name"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        className="flex-1"
      />
      <Button size="sm" onClick={handleAddCategory}>
        <Check size={14} />
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onCancel}
      >
        <X size={14} />
      </Button>
    </div>
  );
};

export default AddCategoryForm;
