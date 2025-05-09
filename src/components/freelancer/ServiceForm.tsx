import React, { useState, useEffect } from 'react';
import { useServiceForm, ServiceFormData } from '@/hooks/useServiceForm';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types/service';
import FormHeader from '@/components/seller/forms/FormHeader';
import FormFooter from '@/components/seller/forms/FormFooter';
import {
  TextField,
  TextareaField,
  PriceField,
  CategoryField
} from '@/components/freelancer/ServiceFormFields';
import ServiceFormDebug from './ServiceFormDebug';
import { Button } from '@/components/ui/button';

// Set this to true for development debugging, false for production
const SHOW_DEBUG = true;

interface ServiceFormProps {
  onSuccess: (service: Service) => void;
  onCancel: () => void;
  editItem?: Service | null;
}

// Define service categories - can be expanded later
const serviceCategories = [
  'Graphic Design', 'Web Design', 'UI/UX Design',
  'Web Development', 'Mobile App Development', 'Software Development',
  'Content Writing', 'Copywriting', 'Editing & Proofreading',
  'Digital Marketing', 'SEO Services', 'Social Media Marketing',
  'Video Editing', 'Photography', 'Voice Over',
  'Translation', 'Tutoring', 'Consulting', 'Other'
];

const ServiceForm: React.FC<ServiceFormProps> = ({ onSuccess, onCancel, editItem }) => {
  const { user } = useAuth();
  const [previewPortfolioName, setPreviewPortfolioName] = useState<string | null>(null);

  const defaultValues: ServiceFormData = {
    title: editItem?.title || '',
    category: editItem?.category || '',
    description: editItem?.description || '',
    price: editItem?.price || 0,
    delivery_time: editItem?.delivery_time || '',
    location: editItem?.location || '',
    whatsapp: editItem?.whatsapp || '',
    portfolio_url: editItem?.portfolio_url || undefined,
    user_id: user?.id || '', // Must be provided
    portfolioFile: null,
  };

  const {
    register,
    handleSubmit,
    errors,
    setValue,
    watch,
    onSubmit,
    isSubmitting,
    control
  } = useServiceForm({
    editItem,
    onSuccess,
    defaultValues,
  });

  // Watch all form values for debugging
  const allFormValues = watch();

  useEffect(() => {
    if (editItem?.portfolio_url) {
        // Extract filename from URL for display
        try {
            const url = new URL(editItem.portfolio_url);
            const pathSegments = url.pathname.split('/');
            setPreviewPortfolioName(decodeURIComponent(pathSegments[pathSegments.length - 1]));
        } catch (e) {
            setPreviewPortfolioName("Existing portfolio file"); // Fallback
        }
    } else {
        setPreviewPortfolioName(null);
    }
  }, [editItem?.portfolio_url]);

  const portfolioFileValue = watch('portfolioFile');
  useEffect(() => {
    if (portfolioFileValue && portfolioFileValue.length > 0) {
      setPreviewPortfolioName(portfolioFileValue[0].name);
    } else if (!editItem?.portfolio_url) {
        // If file is removed and there was no existing URL, clear preview
        setPreviewPortfolioName(null);
    }
  }, [portfolioFileValue, editItem?.portfolio_url]);

  if (!user) {
    return <p className="text-center">Please log in to offer a service.</p>;
  }
  if (!defaultValues.user_id && !editItem) {
      console.error("User ID is missing for new service form.");
      return <p>Error: User information is missing. Cannot add service.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <FormHeader
        title={editItem ? 'Edit Service' : 'Offer New Service'}
        onCancel={onCancel}
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
        <TextField 
          id="title" 
          label="Service Title" 
          required 
          register={register} 
          errors={errors} 
          placeholder="e.g., Professional Logo Design" 
        />
        
        <CategoryField 
          id="category" 
          label="Category" 
          categories={serviceCategories} 
          register={register} 
          errors={errors}
          defaultValue={defaultValues.category}
          handleCategoryChange={(value) => setValue('category', value)} 
          required
        />

        <TextareaField 
          id="description" 
          label="Description" 
          required 
          register={register} 
          errors={errors} 
          placeholder="Describe your service in detail..." 
        />
        
        <PriceField 
          id="price" 
          label="Price (IDR)" 
          required 
          register={register} 
          errors={errors} 
        />

        <TextField 
          id="delivery_time" 
          label="Delivery Time" 
          required 
          register={register} 
          errors={errors} 
          placeholder="e.g., 3 days, 1 week" 
        />
        
        <TextField 
          id="location" 
          label="Location (Optional)" 
          register={register} 
          errors={errors} 
          placeholder="e.g., Jakarta, Indonesia or Remote" 
        />
        
        <TextField 
          id="whatsapp" 
          label="Contact (WhatsApp)" 
          type="tel" 
          required 
          register={register} 
          errors={errors} 
          placeholder="e.g., 081234567890" 
        />
        
        <div>
          <label htmlFor="portfolioFile" className="block text-sm font-medium text-gray-700 mb-1">Upload Portfolio (Optional)</label>
          <input 
            id="portfolioFile"
            type="file"
            {...register('portfolioFile')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {errors.portfolioFile && <p className="text-xs text-red-600 mt-1">{(errors.portfolioFile as any).message}</p>}
          {previewPortfolioName && 
            <p className="text-xs text-gray-500 mt-1">Current file: {previewPortfolioName}</p>
          }
        </div>

        <FormFooter
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          isEditMode={!!editItem}
          itemType="Service"
        />

        {/* Display form debugging information during development */}
        {SHOW_DEBUG && <ServiceFormDebug formValues={allFormValues} errors={errors} />}
      </form>
    </div>
  );
};

export default ServiceForm; 