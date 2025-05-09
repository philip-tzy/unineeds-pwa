import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Plus,
  Briefcase,
  Clock,
  User,
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  CircleCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { customerQuickHireServices, JobApplication } from '@/services/quickhire';
import { FreelanceJob } from '@/types/database';
import JobPostForm from '@/components/customer/JobPostForm';
import NotificationBell from '@/components/NotificationBell';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const CustomerPostedJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<FreelanceJob | null>(null);
  const [applications, setApplications] = useState<Record<string, JobApplication[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isAcceptingApplication, setIsAcceptingApplication] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const jobsData = await customerQuickHireServices.getPostedJobs(user.id);
        setJobs(jobsData);
        
        // Fetch applications for each job
        const applicationsMap: Record<string, JobApplication[]> = {};
        
        for (const job of jobsData) {
          if (job.status === 'open') {
            const jobApplications = await customerQuickHireServices.getJobApplications(job.id);
            applicationsMap[job.id] = jobApplications;
          }
        }
        
        setApplications(applicationsMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load your posted jobs. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
    
    // Set up real-time job application subscriptions
    const subscriptions = [];
    
    return () => {
      // Clean up subscriptions
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [user, toast]);
  
  const setupApplicationSubscription = (jobId: string) => {
    if (openAccordions.includes(jobId) || !user) return;
    
    // Add to opened accordions
    setOpenAccordions(prev => [...prev, jobId]);
    
    // Set up real-time subscription for job applications
    const subscription = customerQuickHireServices.subscribeToJobApplications(
      jobId,
      (newApplication) => {
        setApplications(prev => {
          const existingApplications = prev[jobId] || [];
          
          // Check if application already exists
          const exists = existingApplications.some(app => app.id === newApplication.id);
          
          if (exists) {
            // Update existing application
            return {
              ...prev,
              [jobId]: existingApplications.map(app => 
                app.id === newApplication.id ? newApplication : app
              )
            };
          } else {
            // Add new application
            return {
              ...prev,
              [jobId]: [...existingApplications, newApplication]
            };
          }
        });
        
        // Show notification for new application
        toast({
          title: "New Application",
          description: `${newApplication.freelancer?.name || 'A freelancer'} has applied for your job.`,
        });
      }
    );
    
    // Return subscription to be cleaned up later
    return subscription;
  };
  
  const handleAcceptApplication = async (application: JobApplication) => {
    if (!user || !application || isAcceptingApplication) return;
    
    try {
      setIsAcceptingApplication(true);
      
      await customerQuickHireServices.acceptApplication(
        application.id,
        application.job_id,
        application.freelancer_id
      );
      
      // Update job in local state
      setJobs(prev => prev.map(job => 
        job.id === application.job_id 
          ? { 
              ...job, 
              status: 'in_progress', 
              freelancer_id: application.freelancer_id,
              freelancer: application.freelancer
            } 
          : job
      ));
      
      // Remove job from applications state (since it's no longer open)
      setApplications(prev => {
        const newApplications = { ...prev };
        delete newApplications[application.job_id];
        return newApplications;
      });
      
      toast({
        title: "Success",
        description: `You've accepted ${application.freelancer?.name}'s application.`,
      });
      
    } catch (error) {
      console.error('Error accepting application:', error);
      toast({
        title: "Error",
        description: "Failed to accept application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAcceptingApplication(false);
    }
  };
  
  const handlePostJob = () => {
    setIsPostDialogOpen(true);
  };
  
  const handleJobPosted = async () => {
    setIsPostDialogOpen(false);
    
    // Refresh jobs list
    if (user) {
      try {
        const jobsData = await customerQuickHireServices.getPostedJobs(user.id);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error refreshing jobs:', error);
      }
    }
  };
  
  // Group jobs by status
  const openJobs = jobs.filter(job => job.status === 'open');
  const activeJobs = jobs.filter(job => job.status === 'in_progress');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  
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
              <h1 className="text-xl font-bold">Your Posted Jobs</h1>
              <p className="text-sm opacity-80">Manage your QuickHire job posts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button 
              className="bg-white text-[#003160] hover:bg-gray-100"
              size="sm"
              onClick={handlePostJob}
            >
              <Plus size={16} className="mr-1" />
              Post Job
            </Button>
          </div>
        </div>
      </header>
      
      {/* Job Listings */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003160]"></div>
          </div>
        ) : (
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="open" className="flex-1">
                Open ({openJobs.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1">
                Active ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Completed ({completedJobs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="open" className="space-y-4">
              {openJobs.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <Briefcase size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">You don't have any open jobs</p>
                  <Button 
                    className="mt-4 bg-[#003160] hover:bg-[#002040]"
                    onClick={handlePostJob}
                  >
                    <Plus size={16} className="mr-1" />
                    Post a Job
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-4">
                  {openJobs.map(job => (
                    <AccordionItem 
                      key={job.id} 
                      value={job.id}
                      className="border rounded-lg overflow-hidden bg-white shadow-sm"
                      onValueChange={() => {
                        if (!openAccordions.includes(job.id)) {
                          setupApplicationSubscription(job.id);
                        }
                      }}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex-1 text-left flex items-center gap-2">
                          <Briefcase size={16} className="text-[#003160]" />
                          <div>
                            <h3 className="font-medium text-sm">{job.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>${job.budget}</span>
                              <span>•</span>
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={statusColors[job.status]}>{job.status}</Badge>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 border-t">
                        <div className="pt-3">
                          <h4 className="font-semibold text-sm mb-1">Job Details</h4>
                          <p className="text-sm text-gray-600 mb-3">{job.description}</p>
                          
                          {job.skills_required && job.skills_required.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Required Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {job.skills_required.map((skill, idx) => (
                                  <span key={idx} className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {job.deadline && (
                            <div className="flex items-center text-xs text-gray-600 mb-3">
                              <Clock size={14} className="mr-1" />
                              <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="mt-5 border-t pt-3">
                            <h4 className="font-semibold text-sm mb-3">
                              Applications ({applications[job.id]?.length || 0})
                            </h4>
                            
                            {!applications[job.id] || applications[job.id].length === 0 ? (
                              <p className="text-sm text-gray-500">No applications yet</p>
                            ) : (
                              <div className="space-y-3">
                                {applications[job.id].map(application => (
                                  <Card key={application.id} className="overflow-hidden">
                                    <CardHeader className="p-3 pb-2 flex flex-row items-center">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold mr-2">
                                        {application.freelancer?.name?.charAt(0) || 'F'}
                                      </div>
                                      <div className="flex-1">
                                        <CardTitle className="text-sm font-medium">
                                          {application.freelancer?.name || 'Freelancer'}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500">
                                          Applied {new Date(application.created_at).toLocaleString(undefined, {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      <Badge 
                                        className={
                                          application.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                            : application.status === 'accepted'
                                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                                        }
                                      >
                                        {application.status}
                                      </Badge>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                      <p className="text-sm bg-gray-50 p-2 rounded-md">
                                        {application.proposal}
                                      </p>
                                    </CardContent>
                                    <CardFooter className="p-3 pt-0 flex justify-end gap-2">
                                      {application.status === 'pending' && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {/* Add message functionality */}}
                                          >
                                            <MessageSquare size={14} className="mr-1" />
                                            Message
                                          </Button>
                                          <Button
                                            className="bg-[#003160] hover:bg-[#002040]"
                                            size="sm"
                                            onClick={() => handleAcceptApplication(application)}
                                            disabled={isAcceptingApplication}
                                          >
                                            <CheckCircle size={14} className="mr-1" />
                                            {isAcceptingApplication ? 'Accepting...' : 'Accept'}
                                          </Button>
                                        </>
                                      )}
                                    </CardFooter>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              {activeJobs.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <Clock size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">You don't have any active jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map(job => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{job.title}</CardTitle>
                          <Badge className={statusColors[job.status]}>{job.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>${job.budget}</span>
                          <span>•</span>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-600 mb-3">{job.description}</p>
                        
                        <div className="bg-blue-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium flex items-center text-blue-800">
                            <User size={14} className="mr-1" />
                            Assigned Freelancer
                          </h4>
                          <div className="mt-2 flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold mr-2">
                              {job.freelancer?.name?.charAt(0) || 'F'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {job.freelancer?.name || 'Freelancer'}
                              </p>
                              <p className="text-xs text-gray-600">
                                Working since {new Date(job.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                        >
                          <MessageSquare size={14} className="mr-1" />
                          Message
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {completedJobs.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <CircleCheck size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">You don't have any completed jobs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedJobs.map(job => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">{job.title}</CardTitle>
                          <Badge className={statusColors[job.status]}>{job.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>${job.budget}</span>
                          <span>•</span>
                          <span>Completed {new Date(job.updated_at).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center mt-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold mr-2">
                            {job.freelancer?.name?.charAt(0) || 'F'}
                          </div>
                          <span className="text-sm">
                            Completed by {job.freelancer?.name || 'Freelancer'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Post Job Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
            <DialogDescription>
              Fill in the details below to post a job for freelancers.
            </DialogDescription>
          </DialogHeader>
          
          <JobPostForm 
            onSuccess={handleJobPosted}
            onCancel={() => setIsPostDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPostedJobs; 