import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types/service';
import SimpleServiceForm from '@/components/freelancer/SimpleServiceForm';
import ServicesList from '@/components/freelancer/ServicesList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';

const ManageServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleAddNewServiceClick = () => {
    setEditingService(null);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = (service?: Service) => { // service arg is from onSuccess callback
    setIsFormVisible(false);
    setEditingService(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingService(null);
  };

  if (!user) {
    return <div className="p-4 text-center">Please log in to manage your services.</div>;
  }
  // Add role check if necessary: user.role === 'freelancer'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Offered Services</h1>
          {!isFormVisible && (
            <Button 
              onClick={handleAddNewServiceClick} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
            >
              <PlusCircle size={20} className="mr-2" /> Offer New Service
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {isFormVisible && (
          <div className="mb-8">
            <SimpleServiceForm 
              editItem={editingService}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        <div className={`${isFormVisible ? 'mt-8 pt-6 border-t border-gray-200' : ''}`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {isFormVisible ? (editingService ? 'Editing Service' : 'Adding New Service') : 'Your Current Services'}
          </h2>
          <ServicesList onEdit={handleEditService} refreshTrigger={refreshTrigger} />
        </div>
      </main>
      
      <FreelancerBottomNavigation />
    </div>
  );
};

export default ManageServicesPage; 