
import React from 'react';
import { useCategoryManager } from './category/useCategoryManager';
import CategoryHeader from './category/CategoryHeader';
import AddCategoryForm from './category/AddCategoryForm';
import CategoryList from './category/CategoryList';

interface CategoryManagerProps {
  onSelectCategory: (id: string | null) => void;
  selectedCategoryId: string | null;
  onCategoryChange?: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onSelectCategory,
  selectedCategoryId,
  onCategoryChange
}) => {
  const {
    categories,
    newCategoryName,
    isAdding,
    editingCategory,
    editName,
    isLoading,
    setNewCategoryName,
    setIsAdding,
    setEditingCategory,
    setEditName,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    startEditing
  } = useCategoryManager(onCategoryChange);

  const handleCategorySelect = (id: string) => {
    onSelectCategory(id);
  };

  const handleCategoryDelete = async (id: string) => {
    const success = await handleDeleteCategory(id);
    if (success && selectedCategoryId === id) {
      onSelectCategory(null);
    }
  };

  return (
    <div className="space-y-3">
      <CategoryHeader 
        isAdding={isAdding} 
        onAdd={() => setIsAdding(true)} 
      />
      
      {isAdding && (
        <AddCategoryForm
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleAddCategory={handleAddCategory}
          onCancel={() => {
            setIsAdding(false);
            setNewCategoryName('');
          }}
        />
      )}
      
      <CategoryList
        categories={categories}
        isLoading={isLoading}
        selectedCategoryId={selectedCategoryId}
        editingCategory={editingCategory}
        editName={editName}
        onSelectCategory={handleCategorySelect}
        onStartEditing={startEditing}
        onDeleteCategory={handleCategoryDelete}
        setEditName={setEditName}
        setEditingCategory={setEditingCategory}
        handleUpdateCategory={handleUpdateCategory}
      />
    </div>
  );
};

export default CategoryManager;
