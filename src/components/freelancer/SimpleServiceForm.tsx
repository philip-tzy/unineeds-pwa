import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { freelancerServices } from '@/services/api';
import { Service, NewService } from '@/types/service';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from '@/components/ui/button';

interface SimpleServiceFormProps {
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

const SimpleServiceForm: React.FC<SimpleServiceFormProps> = ({ onSuccess, onCancel, editItem }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<NewService>>({
    title: editItem?.title || '',
    category: editItem?.category || '',
    description: editItem?.description || '',
    price: editItem?.price || 0,
    delivery_time: editItem?.delivery_time || '',
    location: editItem?.location || '',
    whatsapp: editItem?.whatsapp || '',
    portfolio_url: editItem?.portfolio_url || undefined,
    user_id: user?.id || '',
  });
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [portfolioFileName, setPortfolioFileName] = useState<string | null>(
    editItem?.portfolio_url ? 'Current file: ' + editItem.portfolio_url.split('/').pop() : null
  );

  // Update user_id if it changes
  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, user_id: user.id }));
    }
  }, [user?.id]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle price as a special case
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) || value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? 0 : numValue
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field when user changes it
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          portfolio_file: 'File is too large. Maximum size is 5MB.' 
        }));
        return;
      }
      
      setPortfolioFile(file);
      setPortfolioFileName(file.name);
      
      // Clear file error if exists
      if (errors.portfolio_file) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.portfolio_file;
          return newErrors;
        });
      }
    } else {
      setPortfolioFile(null);
      setPortfolioFileName(editItem?.portfolio_url ? 'Current file: ' + editItem.portfolio_url.split('/').pop() : null);
    }
  };

  // Clear the selected file
  const handleClearFile = () => {
    setPortfolioFile(null);
    setPortfolioFileName(editItem?.portfolio_url ? 'Current file: ' + editItem.portfolio_url.split('/').pop() : null);
    
    // Reset the file input
    const fileInput = document.getElementById('portfolio_file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.category?.trim()) newErrors.category = 'Category is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!formData.delivery_time?.trim()) newErrors.delivery_time = 'Delivery time is required';
    
    // WhatsApp validation - basic format check
    if (!formData.whatsapp?.trim()) {
      newErrors.whatsapp = 'WhatsApp contact is required';
    } else if (!/^\+?\d{10,15}$/.test(formData.whatsapp.replace(/\s+/g, ''))) {
      newErrors.whatsapp = 'Please enter a valid WhatsApp number (10-15 digits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) return;
    if (!user) {
      setFormError("You must be logged in to offer services.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare service data
      const serviceData: NewService = {
        ...formData as NewService,
        user_id: user.id
      };
      
      let result: Service | null;
      
      if (editItem && editItem.id) {
        // Update existing service
        const { id, created_at, updated_at, ...updateData } = serviceData as any;
        result = await freelancerServices.updateFreelancerService(
          editItem.id,
          updateData,
          portfolioFile,
          editItem.portfolio_url
        );
      } else {
        // Create new service
        result = await freelancerServices.addFreelancerService(
          serviceData,
          portfolioFile
        );
      }
      
      if (result) {
        toast({ 
          title: `Service ${editItem ? 'Updated' : 'Created'}`, 
          description: `Your service "${result.title}" has been ${editItem ? 'updated' : 'created'} successfully.`,
          variant: "default" 
        });
        onSuccess(result);
      } else {
        throw new Error(`Failed to ${editItem ? 'update' : 'add'} service.`);
      }
    } catch (error: any) {
      console.error(`Error ${editItem ? 'updating' : 'adding'} service:`, error);
      setFormError(error.message || `Failed to ${editItem ? 'update' : 'add'} service.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          Please log in to offer services.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{editItem ? 'Edit Service' : 'Offer New Service'}</h3>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Service Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Professional Logo Design"
            className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
        
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select a category</option>
            {serviceCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe your service in detail..."
            className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>
        
        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (IDR) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price || ''}
            onChange={handleChange}
            min="0"
            step="1000"
            placeholder="100000"
            className={`w-full p-2 border rounded-md ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
        </div>
        
        {/* Delivery Time */}
        <div>
          <label htmlFor="delivery_time" className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Time *
          </label>
          <input
            type="text"
            id="delivery_time"
            name="delivery_time"
            value={formData.delivery_time}
            onChange={handleChange}
            placeholder="e.g., 3 days, 1 week"
            className={`w-full p-2 border rounded-md ${errors.delivery_time ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.delivery_time && <p className="text-xs text-red-500 mt-1">{errors.delivery_time}</p>}
        </div>
        
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Jakarta, Indonesia or Remote"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        {/* WhatsApp Contact */}
        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Contact *
          </label>
          <input
            type="text"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            placeholder="e.g., +6281234567890"
            className={`w-full p-2 border rounded-md ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
        </div>
        
        {/* Portfolio File */}
        <div>
          <label htmlFor="portfolio_file" className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio File (Optional)
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              id="portfolio_file"
              name="portfolio_file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <Button 
              type="button"
              variant="outline" 
              onClick={() => document.getElementById('portfolio_file')?.click()}
              className="border border-gray-300"
            >
              Choose File
            </Button>
            {portfolioFileName && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 truncate max-w-xs">{portfolioFileName}</span>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  title="Clear file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {errors.portfolio_file && (
            <p className="text-xs text-red-500 mt-1">{errors.portfolio_file}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 5MB. Supported formats: Images, PDF, DOC, DOCX
          </p>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Saving...' : (editItem ? 'Update Service' : 'Create Service')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimpleServiceForm; 