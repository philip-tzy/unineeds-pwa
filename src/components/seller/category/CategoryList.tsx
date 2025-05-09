
import React from 'react';
import CategoryItem from './CategoryItem';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  selectedCategoryId: string | null;
  editingCategory: string | null;
  editName: string;
  onSelectCategory: (id: string) => void;
  onStartEditing: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  setEditName: (name: string) => void;
  setEditingCategory: (id: string | null) => void;
  handleUpdateCategory: () => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  selectedCategoryId,
  editingCategory,
  editName,
  onSelectCategory,
  onStartEditing,
  onDeleteCategory,
  setEditName,
  setEditingCategory,
  handleUpdateCategory
}) => {
  if (isLoading) {
    return (
      <p className="text-sm text-gray-500 text-center py-2">
        Loading categories...
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-2">
        No categories yet. Add your first one!
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {categories.map(category => (
        <CategoryItem
          key={category.id}
          category={category}
          isEditing={editingCategory === category.id}
          editName={editName}
          selectedCategoryId={selectedCategoryId}
          onSelect={onSelectCategory}
          onEdit={onStartEditing}
          onDelete={onDeleteCategory}
          onEditNameChange={setEditName}
          onSaveEdit={handleUpdateCategory}
          onCancelEdit={() => setEditingCategory(null)}
        />
      ))}
    </div>
  );
};

export default CategoryList;
