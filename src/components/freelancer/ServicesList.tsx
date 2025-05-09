import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Service } from '@/types/service';
import { useAuth } from '@/context/AuthContext';
import { freelancerServices } from '@/services/api';
import ServiceRow from './ServiceRow';
import { Button } from '@/components/ui/button';

interface ServicesListProps {
  onEdit: (service: Service) => void;
  refreshTrigger?: number;
}

const ServicesList: React.FC<ServicesListProps> = ({ onEdit, refreshTrigger }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchServices = useCallback(async () => {
    if (!user) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await freelancerServices.getFreelancerServices(user.id);
      if (Array.isArray(response)) {
        setServices(response as unknown as Service[]);
      } else if (response && typeof response === 'object' && 'error' in response && (response as any).error !== null) {
        console.error('Supabase error object received while fetching services:', response);
        throw new Error((response as any).error.message || 'Failed to fetch services due to a database error.');
      } else if (response === null) {
        setServices([]);
      } else {
        console.error('Unexpected response type from getFreelancerServices:', response);
        throw new Error('Received an unexpected data format for services.');
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      const errorMessage = err.message || 'Failed to load services. Please try again.';
      setError(errorMessage);
      if (!err.message?.includes('database error') && !err.message?.includes('data format')) {
        toast({ title: "Error Fetching Services", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices, refreshTrigger]);

  const handleDeleteService = async (serviceId: string, serviceTitle: string, portfolioUrl?: string | null) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the service "${serviceTitle}"? This will also remove its portfolio file if present.`)) {
      return;
    }
    try {
      // The portfolioUrl is passed to the service for potential deletion from storage (TODO in api.ts)
      const success = await freelancerServices.deleteFreelancerService(serviceId, portfolioUrl);
      if (success) {
        setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
        toast({ title: "Service Deleted", description: `"${serviceTitle}" has been removed.` });
      } else {
        throw new Error('Delete operation did not confirm success.');
      }
    } catch (err: any) {
      console.error('Error deleting service:', err);
      const errorMessage = err.message || `Failed to delete "${serviceTitle}".`;
      toast({ title: "Error Deleting Service", description: errorMessage, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <p className="text-center p-6 text-gray-500">Loading your services...</p>;
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 text-red-700 rounded-md">
        <p className="font-semibold">Error loading services:</p>
        <p className="text-sm">{error}</p>
        <Button onClick={fetchServices} variant="outline" className="mt-4 text-red-700 border-red-700 hover:bg-red-100">
          Try Again
        </Button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
        <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services listed</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by offering your first service.</p>
            {/* The Add button will be on the parent page (ManageServicesPage) */}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map(service => (
        <ServiceRow 
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDelete={handleDeleteService}
        />
      ))}
    </div>
  );
};

export default ServicesList; 