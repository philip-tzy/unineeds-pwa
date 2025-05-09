import { useState, useEffect } from 'react';
import { useForm, DefaultValues, FieldPath, PathValue } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BaseItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  is_available?: boolean;
  is_active?: boolean;
  user_id: string;
}

interface FormConfig<T extends BaseItem> {
  tableName: string;
  editItem?: T | null;
  onSuccess: () => void;
  defaultValues: DefaultValues<T>;
}

export function useItemForm<T extends BaseItem>({ 
  tableName, 
  editItem, 
  onSuccess, 
  defaultValues 
}: FormConfig<T>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isToggleOn, setIsToggleOn] = useState(true);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    reset 
  } = useForm<T>({ defaultValues });

  useEffect(() => {
    if (editItem) {
      reset(editItem as DefaultValues<T>);
      if (editItem.is_available !== undefined) {
        setIsToggleOn(editItem.is_available);
      } else if ((editItem as any).is_active !== undefined) {
        setIsToggleOn((editItem as any).is_active);
      } else {
        setIsToggleOn(true);
      }
    } else {
      reset(defaultValues);
      setIsToggleOn(true);
    }
  }, [editItem, reset, defaultValues]);

  const priceValue = watch('price' as FieldPath<T>);
  const formattedPrice = typeof priceValue === 'number' && !isNaN(priceValue) 
    ? priceValue.toFixed(2) 
    : (typeof defaultValues.price === 'number' ? defaultValues.price.toFixed(2) : '0.00');
  
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
    if (user.id !== formData.user_id && !(editItem && (editItem as any).id)) {
      toast({ title: "Authorization Error", description: "Cannot create item for another user.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const availabilityFieldName = tableName === 'products' ? 'is_active' : 'is_available';
      
      const dataToSubmit = {
        ...formData,
        [availabilityFieldName]: isToggleOn,
        user_id: user.id
      };
      
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
    isToggleOn,
    setIsToggleOn,
    formattedPrice,
    handleCategoryChange,
    handleCategoryIdChange,
    watch,
    setValue,
    reset
  };
}
