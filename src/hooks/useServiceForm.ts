import { useState, useEffect } from 'react';
import { useForm, DefaultValues } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { freelancerServices } from '@/services/api'; // Service API functions are here
import { Service, NewService, UpdatableServiceData } from '@/types/service';

export type ServiceFormData = NewService & { portfolioFile?: FileList | null };
// user_id is removed from EditServiceFormData as it shouldn't be part of form data for updates directly,
// it's mainly for the auth check if needed, but the hook relies on editItem.user_id or auth.user.id.
export type EditServiceFormDataType = UpdatableServiceData & { portfolioFile?: FileList | null }; 

interface ServiceFormConfig {
  editItem?: Service | null;
  onSuccess: (service: Service) => void;
  defaultValues: DefaultValues<ServiceFormData>; 
}

export function useServiceForm({ 
  editItem, 
  onSuccess, 
  defaultValues 
}: ServiceFormConfig) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit,
    formState: { errors },
    setValue, 
    watch, 
    reset,
    control
  } = useForm<ServiceFormData>({
    defaultValues,
    mode: 'onBlur', // Validate on blur for better UX
  });

  // When editItem changes, update the form with the item's values
  useEffect(() => {
    if (editItem) {
      // Explicitly set each field to ensure they're properly controlled
      setValue('title', editItem.title);
      setValue('category', editItem.category);
      setValue('description', editItem.description);
      setValue('price', editItem.price);
      setValue('delivery_time', editItem.delivery_time);
      setValue('location', editItem.location || '');
      setValue('whatsapp', editItem.whatsapp);
      setValue('user_id', editItem.user_id);
      setValue('portfolio_url', editItem.portfolio_url);
    } else {
      reset(defaultValues);
    }
  }, [editItem, setValue, reset, defaultValues]);
  
  const onSubmitHook = async (formData: ServiceFormData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    
    // Validate required fields manually as an extra check
    if (!formData.title || !formData.category || !formData.description || 
        !formData.price || !formData.delivery_time || !formData.whatsapp) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const entityOwnerId = editItem ? editItem.user_id : formData.user_id;
    if (user.id !== entityOwnerId) {
        toast({ title: "Authorization Error", description: "Operation not allowed for this user.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const portfolioFile = formData.portfolioFile?.[0] || null;

    try {
      let result: Service | null;
      
      if (editItem && editItem.id) {
        // For updating existing service
        const { portfolioFile: _, user_id: formUserId, ...serviceSpecificUpdateData } = formData;
        const updatePayload: UpdatableServiceData = serviceSpecificUpdateData;
        
        console.log('Updating service with data:', updatePayload);
        
        result = await freelancerServices.updateFreelancerService(
          editItem.id,
          updatePayload,
          portfolioFile,
          editItem.portfolio_url 
        );
      } else {
        // For creating new service
        const { portfolioFile: _, ...newServiceData } = formData;
        
        console.log('Adding new service with data:', newServiceData);
        
        result = await freelancerServices.addFreelancerService(
          newServiceData as NewService, 
          portfolioFile
        );
      }

      if (result) {
        toast({ title: "Success", description: `Service ${editItem ? 'updated' : 'added'} successfully.` });
        onSuccess(result);
      } else {
        throw new Error(`Failed to ${editItem ? 'update' : 'add'} service.`);
      }

    } catch (error: any) {
      console.error(`Error ${editItem ? 'updating' : 'adding'} service:`, error);
      toast({ title: "Error", description: error.message || `Failed to ${editItem ? 'update' : 'add'} service.`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register, 
    handleSubmit,
    errors,
    setValue, 
    watch, 
    reset,
    control,
    onSubmit: onSubmitHook,
    isSubmitting,
  };
} 