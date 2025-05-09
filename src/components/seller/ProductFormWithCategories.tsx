
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItemForm } from '@/hooks/useItemForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import FormHeader from '@/components/seller/forms/FormHeader';
import FormFooter from '@/components/seller/forms/FormFooter';
import { 
  TextField, 
  TextareaField, 
  PriceField, 
  NumberField, 
  CategoryIdField, 
  AvailabilityToggle 
} from '@/components/seller/forms/FormFields';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Category {
  id: string;
  name: string;
}

interface ProductFormWithCategoriesProps {
  onSuccess: () => void;
  onCancel?: () => void;
  editItem?: any | null;
}

const ProductFormWithCategories: React.FC<ProductFormWithCategoriesProps> = ({ 
  onSuccess, 
  onCancel, 
  editItem 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const defaultValues = {
    name: editItem?.name || '',
    description: editItem?.description || '',
    price: editItem?.price || 0,
    category_id: editItem?.category_id || '',
    inventory: editItem?.inventory || 0,
    is_active: editItem?.is_active || true
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Category added successfully'
      });
      
      setNewCategoryName('');
      setShowNewCategory(false);
      await fetchCategories();
      
      // Auto-select the new category
      if (data) {
        setValue('category_id', data.id);
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/seller/unishop/products');
    }
  };

  const { 
    register, 
    errors, 
    handleSubmit, 
    onSubmit, 
    isSubmitting, 
    isAvailable, 
    setIsAvailable, 
    formattedPrice, 
    handleCategoryIdChange,
    setValue
  } = useItemForm<any>({
    tableName: 'products',
    editItem,
    onSuccess,
    defaultValues
  });

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <FormHeader 
        title={editItem ? 'Edit Product' : 'Add New Product'} 
        onCancel={handleCancel} 
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField 
          id="name"
          label="Product Name"
          required={true}
          placeholder="Wireless Headphones"
          register={register}
          errors={errors}
        />
        
        <TextareaField 
          id="description"
          label="Description"
          placeholder="High-quality wireless headphones with noise cancellation..."
          register={register}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <PriceField 
            register={register} 
            errors={errors} 
            formattedPrice={formattedPrice} 
          />
          
          <NumberField 
            id="inventory"
            label="Inventory"
            min={0}
            placeholder="10"
            register={register}
            errors={errors}
            validationRules={{ 
              min: { value: 0, message: "Inventory cannot be negative" } 
            }}
          />
        </div>
        
        <div className="space-y-2">
          {!showNewCategory ? (
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <CategoryIdField 
                  categories={categories} 
                  defaultValue={editItem?.category_id || undefined}
                  handleCategoryChange={handleCategoryIdChange}
                />
              </div>
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={() => setShowNewCategory(true)}
                className="mb-0.5 ml-2 whitespace-nowrap"
              >
                <Plus size={14} className="mr-1" />
                New Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <TextField 
                id="new_category"
                label="New Category Name"
                required={true}
                placeholder="Electronics"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={handleAddCategory}
                >
                  Add Category
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <AvailabilityToggle 
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          label="Available for purchase"
        />
        
        <FormFooter 
          isSubmitting={isSubmitting} 
          onCancel={handleCancel} 
          isEditMode={!!editItem}
          itemType="Product"
        />
      </form>
    </div>
  );
};

export default ProductFormWithCategories;
