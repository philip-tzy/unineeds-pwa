
import React from 'react';
import { useItemForm } from '@/hooks/useItemForm';
import FormHeader from '@/components/seller/forms/FormHeader';
import FormFooter from '@/components/seller/forms/FormFooter';
import { 
  TextField, 
  TextareaField, 
  PriceField, 
  NumberField, 
  CategoryField, 
  AvailabilityToggle 
} from '@/components/seller/forms/FormFields';
import { Product, NewProduct } from '@/types/product';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editItem?: Product | null;
}

const productCategories = [
  'Electronics', 'Clothing', 'Books', 'Food', 'Health & Beauty', 
  'Home & Kitchen', 'Sports & Outdoors', 'Toys & Games', 'School Supplies', 
  'Accessories', 'Stationery', 'Other'
];

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, onCancel, editItem }) => {
  const defaultValues = {
    name: editItem?.name || '',
    description: editItem?.description || '',
    price: editItem?.price || 0,
    category: editItem?.category || '',
    inventory: editItem?.inventory || 0,
    is_active: editItem?.is_active || true
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
    handleCategoryChange 
  } = useItemForm<NewProduct>({
    tableName: 'products',
    editItem,
    onSuccess,
    defaultValues
  });

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <FormHeader 
        title={editItem ? 'Edit Product' : 'Add New Product'} 
        onCancel={onCancel} 
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
            label="Stock Quantity"
            min={0}
            placeholder="10"
            register={register}
            errors={errors}
            validationRules={{ 
              min: { value: 0, message: "Quantity cannot be negative" } 
            }}
          />
        </div>
        
        <CategoryField 
          categories={productCategories} 
          defaultValue={editItem?.category || undefined}
          handleCategoryChange={handleCategoryChange}
        />
        
        <AvailabilityToggle 
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          label="Product is active and available for purchase"
        />
        
        <FormFooter 
          isSubmitting={isSubmitting} 
          onCancel={onCancel} 
          isEditMode={!!editItem}
          itemType="Product"
        />
      </form>
    </div>
  );
};

export default ProductForm;
