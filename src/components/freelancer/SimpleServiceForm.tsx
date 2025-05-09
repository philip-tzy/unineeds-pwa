import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { freelancerServices } from '@/services/api';
import { Service, NewService } from '@/types/service';
import { useToast } from '@/components/ui/use-toast';

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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPortfolioFile(e.target.files[0]);
    } else {
      setPortfolioFile(null);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery time is required';
    if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp contact is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
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

  if (!user) {
    return <div className="text-center">Please log in to offer a service.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{editItem ? 'Edit Service' : 'Offer New Service'}</h3>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      </div>
      
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
            value={formData.price}
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
            Contact (WhatsApp) *
          </label>
          <input
            type="text"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            placeholder="e.g., 081234567890"
            className={`w-full p-2 border rounded-md ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
        </div>
        
        {/* Portfolio File */}
        <div>
          <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Portfolio (Optional)
          </label>
          <input
            type="file"
            id="portfolio"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {editItem?.portfolio_url && !portfolioFile && (
            <p className="text-xs text-gray-500 mt-1">
              Current portfolio: {editItem.portfolio_url.split('/').pop()}
            </p>
          )}
          {portfolioFile && (
            <p className="text-xs text-gray-500 mt-1">
              Selected file: {portfolioFile.name}
            </p>
          )}
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isSubmitting ? 
              (editItem ? 'Updating...' : 'Saving...') : 
              (editItem ? 'Update Service' : 'Add Service')
            }
          </button>
        </div>
      </form>
      
      {/* Debug Info */}
      <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <h3 className="text-sm font-bold mb-2">Form Debug</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(formData, null, 2)}
        </pre>
        {Object.keys(errors).length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-red-500">Form Errors:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(errors, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleServiceForm; 