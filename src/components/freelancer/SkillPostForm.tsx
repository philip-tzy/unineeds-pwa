import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { freelancerQuickHireServices } from '@/services/quickhire';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SkillPostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    title: string;
    description: string;
    category: string;
    hourly_rate: number;
    tags: string[];
  };
}

const SkillPostForm: React.FC<SkillPostFormProps> = ({ 
  onSuccess, 
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    hourly_rate: initialData?.hourly_rate?.toString() || '',
    tags: initialData?.tags || [] as string[],
    currentTag: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleAddTag = () => {
    if (formData.currentTag.trim() === '') return;
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, prev.currentTag.trim()],
      currentTag: ''
    }));
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post your skills",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (!formData.title || !formData.description || !formData.category || !formData.hourly_rate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert hourly rate to number
      const hourly_rate = parseFloat(formData.hourly_rate);
      if (isNaN(hourly_rate) || hourly_rate <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid hourly rate",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Post skill to the database
      await freelancerQuickHireServices.upsertFreelancerSkill({
        id: formData.id || undefined,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        hourly_rate,
        tags: formData.tags,
        freelancer_id: user.id
      });
      
      toast({
        title: "Success",
        description: formData.id ? "Your skill has been updated successfully!" : "Your skill has been posted successfully!",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!initialData) {
        // Reset form if it's a new skill
        setFormData({
          id: '',
          title: '',
          description: '',
          category: '',
          hourly_rate: '',
          tags: [],
          currentTag: ''
        });
      }
      
    } catch (error) {
      console.error('Error posting skill:', error);
      toast({
        title: "Error",
        description: "Failed to post skill. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Skill Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="E.g., Web Development, Logo Design"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your services in detail"
          className="min-h-24"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <Select 
          value={formData.category} 
          onValueChange={handleSelectChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="programming">Programming</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="video">Video & Animation</SelectItem>
            <SelectItem value="music">Music & Audio</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
        <Input
          id="hourly_rate"
          name="hourly_rate"
          type="number"
          placeholder="Enter your hourly rate"
          min="1"
          step="0.01"
          value={formData.hourly_rate}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="tags">Skills/Tags</Label>
        <div className="flex gap-2">
          <Input
            id="currentTag"
            name="currentTag"
            placeholder="Add a skill or tag"
            value={formData.currentTag}
            onChange={handleChange}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={handleAddTag}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <div 
                key={index} 
                className="bg-gray-100 text-gray-800 text-sm py-1 px-2 rounded-full flex items-center"
              >
                <span>{tag}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveTag(index)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-[#003160] hover:bg-[#002040]" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : formData.id ? 'Update Skill' : 'Add Skill'}
        </Button>
      </div>
    </form>
  );
};

export default SkillPostForm; 