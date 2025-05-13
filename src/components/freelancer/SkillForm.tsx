import React, { useState } from 'react';
// import { useItemForm } from '@/hooks/useItemForm'; // No longer using this
import { useSkillForm } from '@/hooks/useSkillForm'; // Using the new skill-specific hook
import FormHeader from '@/components/seller/forms/FormHeader'; // Reusing seller's FormHeader
import FormFooter from '@/components/seller/forms/FormFooter'; // Reusing seller's FormFooter
import { 
  TextField, 
  TextareaField,
  CategoryField
} from '@/components/seller/forms/FormFields'; // Reusing seller's FormFields
import { Skill } from '@/types/skill'; // NewSkill is implicitly handled by useSkillForm's FormDataType
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SkillFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editItem?: Skill | null;
}

// Define skill categories - can be expanded later
const skillCategories = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science', 
  'Graphic Design', 'UI/UX Design', 'Writing', 'Translation', 
  'Digital Marketing', 'SEO', 'Social Media', 'Video Editing', 
  'Audio Production', 'Photography', 'Business Consulting', 'Financial Advice',
  'Tutoring', 'Language Learning', 'Crafts', 'Other'
];

const SkillForm: React.FC<SkillFormProps> = ({ onSuccess, onCancel, editItem }) => {
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // defaultValues must include user_id for the useSkillForm hook
  const defaultValues = {
    name: editItem?.name || '',
    description: editItem?.description || '',
    category: editItem?.category || '',
    user_id: editItem?.user_id || user?.id || '' // Prioritize editItem, then auth user
  };

  const { 
    register, 
    errors, 
    handleSubmit, 
    onSubmit, // onSubmit is now directly from useSkillForm
    isSubmitting,
    handleCategoryChange,
    setValue // Keep setValue for direct form manipulation if needed
  } = useSkillForm({
    editItem,
    onSuccess: () => {
      setFormError(null);
      onSuccess();
    },
    onError: (error) => {
      setFormError(error.message || 'Failed to save skill. Please try again.');
    },
    defaultValues
    // entityKey is no longer needed as user_id is part of BaseSkillItem
  });

  // Effect to ensure user_id is set if creating a new item and not already in defaultValues
  // This is more of a safeguard, as defaultValues should handle it.
  React.useEffect(() => {
    if (!editItem && user?.id && defaultValues.user_id !== user.id) {
      setValue('user_id', user.id);
    }
    // If editing, and somehow user_id is missing in editItem, but present in user, log warning or handle
    // For now, assume editItem comes with user_id
  }, [user, editItem, setValue, defaultValues.user_id]);

  if (!user) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Please log in to manage your skills.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Safety check for user_id in default values before rendering form
  // if creating new and user_id is still not set, this is a problem.
  if (!defaultValues.user_id && !editItem) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          User information is missing. Cannot add skill. Please try logging out and back in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <FormHeader 
        title={editItem ? 'Edit Skill' : 'Add New Skill'} 
        onCancel={onCancel} 
      />
      
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField 
          id="name"
          label="Skill Name"
          required={true}
          placeholder="e.g., JavaScript, Photoshop"
          register={register}
          errors={errors}
        />
        
        <TextareaField 
          id="description"
          label="Description"
          required={true}
          placeholder="Describe your skill and experience level"
          register={register}
          errors={errors}
        />
        
        <CategoryField 
          id="category"
          label="Category"
          required={true}
          categories={skillCategories} 
          defaultValue={defaultValues.category}
          register={register} 
          errors={errors}
          handleCategoryChange={(value) => setValue('category', value)} 
        />
        
        <input type="hidden" {...register('user_id')} />

        <FormFooter 
          isSubmitting={isSubmitting} 
          onCancel={onCancel} 
          isEditMode={!!editItem}
          itemType="Skill"
        />
      </form>
    </div>
  );
};

export default SkillForm; 