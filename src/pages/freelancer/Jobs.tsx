import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  Filter, 
  Search, 
  Star, 
  ArrowLeft,
  Clock,
  DollarSign,
  MessageSquare,
  Handshake,
  X,
  BriefcaseBusiness,
  ArrowRight
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
import { freelancerQuickHireServices, JobApplication } from '@/services/quickhire';
import { FreelanceJob } from '@/types/database';
import { freelancerServices } from '@/services/api';
import { Service } from '@/types/service';
import { formatPrice } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FreelancerJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FreelanceJob | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  // Fetch jobs and applications on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const jobsData = await freelancerQuickHireServices.getAvailableJobs();
        const applicationsData = await freelancerQuickHireServices.getJobApplications(user.id);
        
        setJobs(jobsData);
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load jobs. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
    
    // Fetch my services
    const fetchMyServices = async () => {
      setServicesLoading(true);
      try {
        const services = await freelancerServices.getFreelancerServices(user.id);
        setMyServices(services || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load your services.",
          variant: "destructive"
        });
      } finally {
        setServicesLoading(false);
      }
    };
    
    fetchMyServices();
    
    // Set up real-time subscription for new jobs
    const subscription = freelancerQuickHireServices.subscribeToNewJobs((newJob) => {
      setJobs(prevJobs => {
        // Check if the job already exists
        if (prevJobs.some(job => job.id === newJob.id)) {
          return prevJobs;
        }
        
        // Add the new job to the top of the list
        return [newJob, ...prevJobs];
      });
      
      // Show notification for new job
      toast({
        title: "New Job Posted",
        description: `A new job "${newJob.title}" has been posted.`,
      });
    });
    
    // Set up real-time subscription for application updates
    const applicationSubscription = freelancerQuickHireServices.subscribeToApplicationUpdates(
      user.id,
      (updatedApplication) => {
        setApplications(prevApplications => {
          const index = prevApplications.findIndex(app => app.id === updatedApplication.id);
          
          if (index >= 0) {
            // Replace the existing application
            const newApplications = [...prevApplications];
            newApplications[index] = updatedApplication;
            return newApplications;
          }
          
          // Add the new application
          return [updatedApplication, ...prevApplications];
        });
        
        // Show notification if application is accepted
        if (updatedApplication.status === 'accepted') {
          toast({
            title: "Application Accepted!",
            description: `Your application for "${updatedApplication.job?.title}" has been accepted.`,
          });
        } else if (updatedApplication.status === 'rejected') {
          toast({
            title: "Application Rejected",
            description: `Your application for job has been rejected.`,
            variant: "destructive"
          });
        }
      }
    );
    
    // Clean up subscriptions on unmount
    return () => {
      subscription.unsubscribe();
      applicationSubscription.unsubscribe();
    };
  }, [user, toast]);
  
  // Filter jobs based on search term and category
  const filteredJobs = jobs.filter(job => {
    // Check if the freelancer has already applied for this job
    const hasApplied = applications.some(app => app.job_id === job.id);
    if (hasApplied) return false;
    
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      (job.skills_required && job.skills_required.some(skill => 
        skill.toLowerCase().includes(selectedCategory.toLowerCase())
      ));
    
    return matchesSearch && matchesCategory;
  });
  
  // Extract unique categories from skills required
  const categories = Array.from(
    new Set(
      jobs.flatMap(job => job.skills_required || [])
        .filter(Boolean)
    )
  );
  
  const openApplyDialog = (job: FreelanceJob) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };
  
  const handleApplyForJob = async () => {
    if (!user || !selectedJob) return;
    
    if (!proposalText.trim()) {
      toast({
        title: "Error",
        description: "Please write a proposal before applying",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await freelancerQuickHireServices.applyForJob({
        job_id: selectedJob.id,
        freelancer_id: user.id,
        proposal: proposalText
      });
      
      // Add the application locally to avoid showing this job again
      setApplications(prev => [
        ...prev, 
        {
          id: 'temp-' + Date.now(),
          job_id: selectedJob.id,
          freelancer_id: user.id,
          proposal: proposalText,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          job: selectedJob
        }
      ]);
      
      toast({
        title: "Success",
        description: "Your application has been submitted successfully!",
      });
      
      setApplyDialogOpen(false);
      setProposalText('');
      setSelectedJob(null);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk membuat layanan baru
  const handleAddService = () => {
    navigate('/freelancer/services');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full hover:bg-[#004180] transition-colors mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Freelancer Jobs</h1>
            <p className="text-sm opacity-80">Find jobs and manage your services</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="services">My Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs" className="mt-2">
          {/* Search */}
          <div className="p-4 bg-white shadow-sm">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 rounded-lg py-2 px-4 pl-10 outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            </div>
            
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-3 py-1 text-sm rounded-full ${
                  !selectedCategory 
                    ? 'bg-[#003160] text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                All
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category ? null : category
                  )}
                  className={`flex-shrink-0 px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category 
                      ? 'bg-[#003160] text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Job Listings */}
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading available jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500">No available jobs found</p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-blue-600 mt-2"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                      ${job.budget}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mt-2 line-clamp-3">
                    {job.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.skills_required?.map(skill => (
                      <span
                        key={skill}
                        className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}} // TODO: Implement view details
                      className="text-gray-700"
                    >
                      View Details
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openApplyDialog(job)}
                      className="bg-[#003160] hover:bg-[#002040]"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="services" className="mt-2">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Services</h2>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleAddService}
                className="text-[#003160] border-[#003160]"
              >
                Add Service
              </Button>
            </div>
            
            {servicesLoading ? (
              <div className="text-center py-8">Loading your services...</div>
            ) : myServices.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow p-6">
                <BriefcaseBusiness className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-600 font-medium">You haven't added any services yet</p>
                <p className="text-gray-500 text-sm mb-4">Create services to showcase your skills and attract clients</p>
                <Button 
                  onClick={handleAddService}
                  className="bg-[#003160] hover:bg-[#002040]"
                >
                  Create Your First Service
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myServices.map(service => (
                  <div key={service.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{service.title}</h3>
                      <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                    
                    <div className="mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mb-2">
                      {service.category}
                    </div>
                    
                    <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{service.delivery_time}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare size={14} className="mr-1" />
                        <span>{service.whatsapp}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/freelancer/services`)}
                        className="text-[#003160]"
                      >
                        Manage
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
            <DialogDescription>
              {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Proposal</label>
              <Textarea
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Introduce yourself and explain why you're a good fit for this job..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-gray-500">Tip: Highlight your relevant skills and experience.</p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleApplyForJob}
              disabled={isSubmitting}
              className="bg-[#003160] hover:bg-[#002040]"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerJobs; 