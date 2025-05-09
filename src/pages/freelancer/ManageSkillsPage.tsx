import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Skill } from '@/types/skill';
import SkillForm from '@/components/freelancer/SkillForm';
import SkillsList from '@/components/freelancer/SkillsList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
// import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation'; // Assuming this exists or will be created
// import PageHeader from '@/components/layout/PageHeader'; // Generic page header

const ManageSkillsPage: React.FC = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0); // To trigger list refresh

  const handleAddNewSkillClick = () => {
    setEditingSkill(null);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setEditingSkill(null);
    setRefreshTrigger(prev => prev + 1); // Increment to trigger refresh
    // Toast messages are handled within the form hook
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingSkill(null);
  };

  if (!user) {
    // Or redirect to login
    return <div className="p-4 text-center">Please log in to manage your skills.</div>;
  }
  // Ensure user is a freelancer, or has freelancer capabilities
  // if (user.role !== 'freelancer') { 
  //   return <div className="p-4 text-center">This page is for freelancers only.</div>;
  // }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* <PageHeader title="Manage Your Skills" /> */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">My Skills</h1>
            {!isFormVisible && (
                 <Button 
                    onClick={handleAddNewSkillClick} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                >
                    <Plus size={18} className="mr-2" /> Add Skill
                </Button>
            )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {isFormVisible && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <SkillForm 
              editItem={editingSkill}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {!isFormVisible && (
          <SkillsList onEdit={handleEditSkill} refreshTrigger={refreshTrigger} />
        )}
      </main>
      
      {/* <FreelancerBottomNavigation /> */}
      {/* Placeholder for bottom navigation if applicable */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t text-center text-xs text-gray-500">
        Freelancer Portal
      </div>
    </div>
  );
};

export default ManageSkillsPage; 