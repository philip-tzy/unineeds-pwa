import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Tag,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { freelancerQuickHireServices, FreelancerSkill } from '@/services/quickhire';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
import SkillPostForm from '@/components/freelancer/SkillPostForm';
import NotificationBell from '@/components/NotificationBell';

const FreelancerSkills: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [skills, setSkills] = useState<FreelancerSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<FreelancerSkill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const skillsData = await freelancerQuickHireServices.getFreelancerSkills(user.id);
        setSkills(skillsData);
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: "Error",
          description: "Failed to load your skills. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSkills();
  }, [user, toast]);
  
  const handleEditSkill = (skill: FreelancerSkill) => {
    setSelectedSkill(skill);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteSkill = (skill: FreelancerSkill) => {
    setSelectedSkill(skill);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteSkill = async () => {
    if (!selectedSkill) return;
    
    setIsDeleting(true);
    try {
      await freelancerQuickHireServices.deleteFreelancerSkill(selectedSkill.id);
      
      // Update local state
      setSkills(prev => prev.filter(skill => skill.id !== selectedSkill.id));
      
      toast({
        title: "Success",
        description: "Skill has been deleted successfully.",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedSkill(null);
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to delete skill. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSkillUpdated = async () => {
    if (!user) return;
    
    // Refresh skills list
    try {
      const skillsData = await freelancerQuickHireServices.getFreelancerSkills(user.id);
      setSkills(skillsData);
    } catch (error) {
      console.error('Error refreshing skills:', error);
    }
    
    // Close dialogs
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedSkill(null);
  };
  
  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    acc[skill.category] = [...(acc[skill.category] || []), skill];
    return acc;
  }, {} as Record<string, FreelancerSkill[]>);
  
  const categoryTitles: Record<string, string> = {
    'programming': 'Programming & Development',
    'design': 'Design & Creative',
    'writing': 'Writing & Translation',
    'marketing': 'Marketing',
    'video': 'Video & Animation',
    'music': 'Music & Audio',
    'business': 'Business',
    'other': 'Other Services'
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 rounded-full hover:bg-[#004180] transition-colors mr-3"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">My Skills</h1>
              <p className="text-sm opacity-80">Manage your services for QuickHire</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button 
              className="bg-white text-[#003160] hover:bg-gray-100"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Skill
            </Button>
          </div>
        </div>
      </header>
      
      {/* Skills List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003160]"></div>
          </div>
        ) : skills.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-600 mb-2">You haven't added any skills yet</p>
            <p className="text-gray-500 text-sm mb-4">
              Add skills and services you can offer to customers through QuickHire
            </p>
            <Button 
              className="bg-[#003160] hover:bg-[#002040]"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              Add Your First Skill
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3">
                  {categoryTitles[category] || category}
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {categorySkills.map(skill => (
                    <Card key={skill.id} className="overflow-hidden bg-white">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{skill.title}</h3>
                          <span className="flex items-center text-green-700 font-medium">
                            <DollarSign size={16} className="mr-0.5" />
                            {skill.hourly_rate}/hr
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {skill.description}
                        </p>
                        
                        {skill.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {skill.tags.map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 text-xs px-2 py-1 rounded-full flex items-center">
                                <Tag size={10} className="mr-1 text-gray-500" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          Updated {new Date(skill.updated_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end gap-2 border-t mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteSkill(skill)}
                        >
                          <Trash2 size={14} className="mr-1 text-red-500" />
                          Delete
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#003160] hover:bg-[#002040]"
                          onClick={() => handleEditSkill(skill)}
                        >
                          <Pencil size={14} className="mr-1" />
                          Edit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Skill Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a New Skill</DialogTitle>
            <DialogDescription>
              Describe a skill or service you can offer to customers.
            </DialogDescription>
          </DialogHeader>
          
          <SkillPostForm 
            onSuccess={handleSkillUpdated}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Skill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update your skill or service details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSkill && (
            <SkillPostForm 
              initialData={selectedSkill}
              onSuccess={handleSkillUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this skill from your profile.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSkill}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bottom Navigation */}
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerSkills; 