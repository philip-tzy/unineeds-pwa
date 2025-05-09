import { useState, useEffect } from 'react';
import { useForm, DefaultValues, FieldPath, PathValue } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skill, NewSkill } from '@/types/skill'; // Import Skill types

// Interface for items handled by this skill-specific form hook
interface BaseSkillItem {
  name: string;
  description?: string;
  category?: string;
  user_id: string; // user_id is essential
  // No price, is_available, is_active for skills
}

// Ensure NewSkill matches BaseSkillItem structure (excluding id, created_at, updated_at from Skill)
// This type assertion helps if NewSkill definition changes.
type FormDataType = Omit<Skill, 'id' | 'created_at' | 'updated_at'> & BaseSkillItem;

interface SkillFormConfig {
  editItem?: Skill | null; // Expecting the full Skill type for editing
  onSuccess: () => void;
  defaultValues: DefaultValues<FormDataType>;
}

const TABLE_NAME = 'skills';

export function useSkillForm({ 
  editItem, 
  onSuccess, 
  defaultValues 
}: SkillFormConfig) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, // Keep watch if needed for other dynamic fields in the future
    reset 
  } = useForm<FormDataType>({ defaultValues });

  useEffect(() => {
    if (editItem) {
      // Map Skill to FormDataType if necessary, though they should be compatible
      reset(editItem as unknown as DefaultValues<FormDataType>); 
    } else {
      // Ensure user_id is part of defaultValues, ideally set by the calling component
      reset(defaultValues);
    }
  }, [editItem, reset, defaultValues]);
  
  const handleCategoryChange = (value: string) => {
    setValue('category' as FieldPath<FormDataType>, value as PathValue<FormDataType, FieldPath<FormDataType>>);
  };

  const onSubmitHook = async (formData: FormDataType) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to manage skills.", variant: "destructive" });
      return;
    }
    // Ensure the skill being added/edited belongs to the authenticated user
    if (user.id !== formData.user_id) {
        toast({ title: "Authorization Error", description: "Skill operation not allowed for this user.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const dataToSubmit: NewSkill = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        user_id: user.id, // Ensure authenticated user's ID is used
      };
      
      if (editItem && editItem.id) {
        const { error } = await supabase
          .from(TABLE_NAME as any) // Using 'as any' due to potential Supabase global type issues
          .update(dataToSubmit)
          .eq('id', editItem.id);
          
        if (error) throw error;
        toast({ title: "Success", description: `Skill updated successfully` });
      } else {
        const { error } = await supabase
          .from(TABLE_NAME as any)
          .insert(dataToSubmit);
          
        if (error) throw error;
        toast({ title: "Success", description: `Skill added successfully` });
      }
      onSuccess();
    } catch (error) {
      const operation = editItem ? 'update' : 'add';
      console.error(`Error ${operation}ing skill:`, error);
      toast({ title: "Error", description: `Failed to ${operation} skill. Please try again.`, variant: "destructive" });
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
    handleCategoryChange, // For category dropdown
    watch, // If needed by form
    setValue, // If needed by form
    reset
  };
} 