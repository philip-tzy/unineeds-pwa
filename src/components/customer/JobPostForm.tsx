import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { customerQuickHireServices } from '@/services/quickhire';
import { Calendar, Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface JobPostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const JobPostForm: React.FC<JobPostFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    skills: [] as string[],
    currentSkill: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (formData.currentSkill.trim() === '') return;
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, prev.currentSkill.trim()],
      currentSkill: ''
    }));
  };

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (!formData.title || !formData.description || !formData.budget) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert budget to number
      const budget = parseFloat(formData.budget);
      if (isNaN(budget) || budget <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid budget amount",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Post job to the database
      await customerQuickHireServices.postJob({
        title: formData.title,
        description: formData.description,
        budget,
        customer_id: user.id,
        skills_required: formData.skills,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        service_type: 'quickhire'
      });
      
      toast({
        title: "Success",
        description: "Your job has been posted successfully!",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        skills: [],
        currentSkill: ''
      });
      
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Job Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Enter job title"
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
          placeholder="Describe the job in detail"
          className="min-h-24"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="budget">Budget (USD)</Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          placeholder="Enter your budget"
          min="1"
          step="0.01"
          value={formData.budget}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="deadline">Deadline (Optional)</Label>
        <div className="relative">
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
          />
          <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="skills">Required Skills</Label>
        <div className="flex gap-2">
          <Input
            id="currentSkill"
            name="currentSkill"
            placeholder="Add a skill"
            value={formData.currentSkill}
            onChange={handleChange}
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={handleAddSkill}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill, index) => (
              <div 
                key={index} 
                className="bg-gray-100 text-gray-800 text-sm py-1 px-2 rounded-full flex items-center"
              >
                <span>{skill}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
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
          {isSubmitting ? 'Posting...' : 'Post Job'}
        </Button>
      </div>
    </form>
  );
};

export default JobPostForm; 