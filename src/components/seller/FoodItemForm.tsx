import React, { useState } from 'react';
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
import { FoodItem, NewFoodItem } from '@/types/food';

interface FoodItemFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editItem?: FoodItem | null;
}

const foodCategories = [
  'Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Snack', 'Breakfast',
  'Lunch', 'Dinner', 'Side Dish', 'Salad', 'Soup', 'Sandwich', 'Pizza', 'Pasta', 'Other'
];

const FoodItemForm: React.FC<FoodItemFormProps> = ({ onSuccess, onCancel, editItem }) => {
  // Track local state for more responsive input
  const [itemName, setItemName] = useState(editItem?.name || '');
  const [itemDescription, setItemDescription] = useState(editItem?.description || '');
  
  const defaultValues = {
    name: editItem?.name || '',
    description: editItem?.description || '',
    price: editItem?.price || 0,
    category: editItem?.category || '',
    preparation_time: editItem?.preparation_time || 15,
    is_available: editItem?.is_available || true,
    stock: editItem?.stock || 10
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
    handleCategoryChange,
    setValue
  } = useItemForm<NewFoodItem>({
    tableName: 'food_items',
    serviceType: 'unifood',
    editItem,
    onSuccess,
    defaultValues
  });
  
  // Handle local changes and update form values
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemName(e.target.value);
    setValue('name', e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setItemDescription(e.target.value);
    setValue('description', e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <FormHeader 
        title={editItem ? 'Edit Menu Item' : 'Add New Menu Item'} 
        onCancel={onCancel} 
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField 
          id="name"
          label="Item Name"
          required={true}
          placeholder="Chicken Burger"
          register={register}
          errors={errors}
          value={itemName}
          onChange={handleNameChange}
        />
        
        <TextareaField 
          id="description"
          label="Description"
          placeholder="Delicious grilled chicken with lettuce, tomato and special sauce..."
          register={register}
          value={itemDescription}
          onChange={handleDescriptionChange}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <PriceField 
            register={register} 
            errors={errors} 
            formattedPrice={formattedPrice} 
          />
          
          <NumberField 
            id="preparation_time"
            label="Prep Time (mins)"
            min={1}
            placeholder="15"
            register={register}
            errors={errors}
            validationRules={{ 
              min: { value: 1, message: "Time must be at least 1 minute" } 
            }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <NumberField 
            id="stock"
            label="Initial Stock"
            min={0}
            placeholder="10"
            register={register}
            errors={errors}
            validationRules={{ 
              min: { value: 0, message: "Stock cannot be negative" } 
            }}
          />
        </div>
        
        <CategoryField 
          categories={foodCategories} 
          defaultValue={editItem?.category || undefined}
          handleCategoryChange={handleCategoryChange}
        />
        
        <AvailabilityToggle 
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          label="Available for ordering"
        />
        
        <FormFooter 
          isSubmitting={isSubmitting} 
          onCancel={onCancel} 
          isEditMode={!!editItem}
          itemType="Item"
        />
      </form>
    </div>
  );
};

export default FoodItemForm;
