import { useState, useEffect } from 'react';
import { useForm, DefaultValues, FieldPath, PathValue } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type ServiceType = 'unishop' | 'unifood';

interface BaseItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  is_available?: boolean;
  is_active?: boolean;
  user_id: string;
  service_type?: ServiceType;
}

interface FormConfig<T extends BaseItem> {
  tableName: string;
  serviceType?: ServiceType;
  editItem?: T | null;
  onSuccess: () => void;
  defaultValues: DefaultValues<T>;
}

export function useItemForm<T extends BaseItem>({ 
  tableName, 
  serviceType = 'unishop',
  editItem, 
  onSuccess, 
  defaultValues 
}: FormConfig<T>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(
    editItem?.is_available ?? editItem?.is_active ?? true
  );

  // Use react-hook-form with minimal interception
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset,
    getValues
  } = useForm<T>({
    defaultValues,
    mode: 'onChange', // Changed from onBlur to onChange for better reactivity
    shouldUnregister: false, // Don't unregister on unmount
  });

  useEffect(() => {
    if (editItem) {
      // Don't reset the form completely as it can cause flicker, just update values
      Object.keys(editItem).forEach(key => {
        if (key in defaultValues) {
          setValue(key as FieldPath<T>, editItem[key as keyof T] as PathValue<T, FieldPath<T>>, {
            shouldValidate: false, // Don't validate immediately
            shouldDirty: false,    // Don't mark as dirty
            shouldTouch: false     // Don't mark as touched
          });
        }
      });
      
      if (editItem.is_available !== undefined) {
        setIsAvailable(editItem.is_available);
      } else if ((editItem as any).is_active !== undefined) {
        setIsAvailable((editItem as any).is_active);
      }
    }
  }, [editItem, setValue, defaultValues]);

  // Watch the price field to format it
  const priceValue = watch('price' as FieldPath<T>);
  
  // Format the price for display
  const formattedPrice = typeof priceValue === 'number' && !isNaN(priceValue) 
    ? priceValue.toFixed(2) 
    : '0.00';
  
  const handleCategoryChange = (value: string) => {
    setValue('category' as FieldPath<T>, value as PathValue<T, FieldPath<T>>);
  };
  
  const handleCategoryIdChange = (value: string) => {
    setValue('category_id' as FieldPath<T>, value as PathValue<T, FieldPath<T>>);
  };

  const onSubmitHook = async (formData: T) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const availabilityFieldName = tableName === 'products' ? 'is_active' : 'is_available';
      
      const dataToSubmit = {
        ...formData,
        [availabilityFieldName]: isAvailable,
        user_id: user.id,
        service_type: serviceType
      };
      
      console.log('Submitting form data:', dataToSubmit);
      
      if (editItem && (editItem as any).id) {
        const { error } = await supabase
          .from(tableName as any)
          .update(dataToSubmit)
          .eq('id', (editItem as any).id);
          
        if (error) throw error;
        toast({ title: "Success", description: `${tableName.slice(0, -1)} updated successfully` });
      } else {
        const { error } = await supabase
          .from(tableName as any)
          .insert(dataToSubmit);
          
        if (error) throw error;
        toast({ title: "Success", description: `${tableName.slice(0, -1)} added successfully` });
      }
      onSuccess();
    } catch (error) {
      const operation = editItem ? 'update' : 'add';
      console.error(`Error ${operation}ing ${tableName} item:`, error);
      toast({ title: "Error", description: `Failed to ${operation} item. Please try again.`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    errors,
    handleSubmit,
    onSubmit: onSubmitHook,
    isSubmitting,
    isAvailable,
    setIsAvailable,
    formattedPrice,
    handleCategoryChange,
    handleCategoryIdChange,
    watch,
    setValue,
    reset,
    getValues
  };
}
