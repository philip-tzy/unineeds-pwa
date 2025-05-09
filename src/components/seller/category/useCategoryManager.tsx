
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Category {
  id: string;
  name: string;
  user_id: string;
}

export const useCategoryManager = (onCategoryChange?: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;
      
      setCategories(data || []);
      // Call onCategoryChange callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('product_categories')
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id
        });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Category added successfully'
      });
      
      setNewCategoryName('');
      setIsAdding(false);
      fetchCategories();
      // Call onCategoryChange callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editName.trim() || !editingCategory || !user) return;
    
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ name: editName.trim() })
        .eq('id', editingCategory)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Category updated successfully'
      });
      
      setEditingCategory(null);
      fetchCategories();
      // Call onCategoryChange callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
      
      fetchCategories();
      // Call onCategoryChange callback if provided
      if (onCategoryChange) {
        onCategoryChange();
      }
      
      return true; // Return true to indicate successful deletion
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Make sure it has no products assigned to it.',
        variant: 'destructive'
      });
      return false; // Return false to indicate failed deletion
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  return {
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
    fetchCategories,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    startEditing
  };
};
