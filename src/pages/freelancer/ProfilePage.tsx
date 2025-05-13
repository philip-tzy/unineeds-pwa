import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileEditor } from '@/components/freelancer/ProfileEditor';
import { ArrowLeft } from 'lucide-react';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';

const FreelancerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-[#003160] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full hover:bg-blue-700 transition-colors mr-3"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Freelancer Profile</h1>
            <p className="text-xs opacity-80">Manage your profile information and settings</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <ProfileEditor />
      </main>
      
      {/* Bottom Navigation */}
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerProfilePage; 