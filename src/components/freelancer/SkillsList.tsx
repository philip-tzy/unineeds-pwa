import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Skill } from '@/types/skill';
import { useAuth } from '@/context/AuthContext';
import { freelancerServices } from '@/services/api'; // Using the new freelancerServices
import SkillRow from './SkillRow'; // Import the new SkillRow component
import { Button } from '@/components/ui/button'; // Added Button import
// Generic states for loading, empty, error can be created or reused
// For now, simple text will be used.

interface SkillsListProps {
  onEdit: (skill: Skill) => void;
  // A prop to trigger re-fetching when a skill is added/updated externally
  refreshTrigger?: number; 
}

const SkillsList: React.FC<SkillsListProps> = ({ onEdit, refreshTrigger }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSkills = useCallback(async () => {
    if (!user) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await freelancerServices.getSkills(user.id);
      // Check if the response is an array and not a Supabase error object
      // Supabase success data is usually an array, errors are objects with an 'error' key.
      if (Array.isArray(response)) {
        // If it's an array, assume it's Skill[]. Cast via unknown for type safety.
        setSkills(response as unknown as Skill[]); 
      } else if (response && typeof response === 'object' && 'error' in response && (response as any).error !== null) {
        // This means getSkills might have returned the Supabase error object directly
        console.error('Supabase error object received:', response);
        throw new Error((response as any).error.message || 'Failed to fetch skills due to a database error.');
      } else if (response === null) {
        setSkills([]); // Service might return null for no data or if it handled an error internally that way
      } else {
        // Unexpected response type
        console.error('Unexpected response type from getSkills:', response);
        throw new Error('Received an unexpected data format for skills.');
      }
    } catch (err: any) {
      console.error('Error fetching skills:', err);
      const errorMessage = err.message || 'Failed to load skills. Please try again.';
      setError(errorMessage);
      // Avoid duplicate toasts if the error was already specific
      if (!err.message?.includes('database error') && !err.message?.includes('data format')) {
        toast({ title: "Error Fetching Skills", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills, refreshTrigger]); // Re-fetch if user changes or refreshTrigger changes

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the skill "${skillName}"?`)) {
      return;
    }
    try {
      // deleteSkill service is expected to return true on success or throw error
      const success = await freelancerServices.deleteSkill(skillId);
      if (success) {
        setSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillId));
        toast({ title: "Skill Deleted", description: `"${skillName}" has been removed.` });
      } else {
        // Should not happen if service throws error on failure
        throw new Error('Delete operation did not confirm success.');
      }
    } catch (err: any) {
      console.error('Error deleting skill:', err);
      const errorMessage = err.message || `Failed to delete "${skillName}".`;
      toast({ title: "Error Deleting Skill", description: errorMessage, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <p className="text-center p-4">Loading skills...</p>;
  }

  if (error) {
    // Ensure Button is styled appropriately, or use a custom component if available
    return <div className="text-center p-4 text-red-500">
      <p>Error: {error}</p>
      <Button onClick={fetchSkills} variant="link" className="mt-2 text-blue-500 hover:text-blue-700">
        Retry
      </Button>
    </div>;
  }

  if (skills.length === 0) {
    return <p className="text-center p-4 text-gray-500">You haven't added any skills yet. Add your first skill to get started!</p>;
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 min-h-[200px]">
      {skills.map(skill => (
        <SkillRow 
          key={skill.id}
          skill={skill}
          onEdit={onEdit}
          onDelete={handleDeleteSkill}
        />
      ))}
    </div>
  );
};

export default SkillsList; 