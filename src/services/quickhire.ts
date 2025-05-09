import { supabase } from '@/integrations/supabase/client';
import { FreelanceJob } from '@/types/database';

// Types for QuickHire service
export type FreelancerSkill = {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  category: string;
  hourly_rate: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  freelancer?: {
    id: string;
    name: string;
    avatar_url?: string;
    freelancer_skill?: string;
  };
};

export type JobApplication = {
  id: string;
  job_id: string;
  freelancer_id: string;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  freelancer?: {
    id: string;
    name: string;
    avatar_url?: string;
    freelancer_skill?: string;
  };
  job?: FreelanceJob;
};

export type QuickHireTransaction = {
  id: string;
  job_id: string;
  customer_id: string;
  freelancer_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
  };
  freelancer?: {
    id: string;
    name: string;
  };
  job?: FreelanceJob;
};

// Customer Services
export const customerQuickHireServices = {
  // Post a new job
  postJob: async (job: Omit<FreelanceJob, 'id' | 'created_at' | 'updated_at' | 'status' | 'freelancer_id'>) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .insert({ ...job, status: 'open' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get customer's posted jobs
  getPostedJobs: async (customerId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .select(`
        *,
        freelancer:freelancer_id(id, name, avatar_url, freelancer_skill)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Get applications for a specific job
  getJobApplications: async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        freelancer:freelancer_id(id, name, avatar_url, freelancer_skill)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Accept a freelancer's application
  acceptApplication: async (applicationId: string, jobId: string, freelancerId: string) => {
    // Begin a transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) throw transactionError;
    
    try {
      // First, update the application status
      const { error: applicationError } = await supabase
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);
      
      if (applicationError) throw applicationError;
      
      // Then, update the job to assign the freelancer
      const { data: jobData, error: jobError } = await supabase
        .from('freelance_jobs')
        .update({ 
          freelancer_id: freelancerId, 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();
      
      if (jobError) throw jobError;
      
      // Finally, reject all other applications for this job
      const { error: rejectError } = await supabase
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .neq('id', applicationId);
      
      if (rejectError) throw rejectError;
      
      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;
      
      return jobData;
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  },
  
  // Get available freelancer skills/services
  getFreelancerSkills: async () => {
    const { data, error } = await supabase
      .from('freelancer_skills')
      .select(`
        *,
        freelancer:freelancer_id(id, name, avatar_url, freelancer_skill)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Create a transaction for hiring a freelancer directly
  createTransaction: async (transaction: Omit<QuickHireTransaction, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('quickhire_transactions')
      .insert({ ...transaction, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get customer's transactions
  getTransactions: async (customerId: string) => {
    const { data, error } = await supabase
      .from('quickhire_transactions')
      .select(`
        *,
        freelancer:freelancer_id(id, name),
        job:job_id(id, title, description)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Set up real-time subscriptions for job applications
  subscribeToJobApplications: (jobId: string, callback: (application: JobApplication) => void) => {
    return supabase
      .channel(`job-applications-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          // Fetch the complete application data with freelancer details
          supabase
            .from('job_applications')
            .select(`
              *,
              freelancer:freelancer_id(id, name, avatar_url, freelancer_skill)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                callback(data as JobApplication);
              }
            });
        }
      )
      .subscribe();
  }
};

// Freelancer Services
export const freelancerQuickHireServices = {
  // Get available jobs
  getAvailableJobs: async () => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .select(`
        *,
        customer:customer_id(id, name, avatar_url)
      `)
      .eq('status', 'open')
      .is('freelancer_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Apply for a job
  applyForJob: async (application: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ ...application, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get freelancer's job applications
  getJobApplications: async (freelancerId: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:job_id(id, title, description, budget, customer_id, status, deadline, 
          customer:customer_id(id, name, avatar_url))
      `)
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Get freelancer's accepted jobs
  getAcceptedJobs: async (freelancerId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .select(`
        *,
        customer:customer_id(id, name, avatar_url)
      `)
      .eq('freelancer_id', freelancerId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Add or update freelancer skill/service
  upsertFreelancerSkill: async (skill: Omit<FreelancerSkill, 'created_at' | 'updated_at'>) => {
    const { id, ...rest } = skill;
    
    if (id) {
      // Update existing skill
      const { data, error } = await supabase
        .from('freelancer_skills')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Add new skill
      const { data, error } = await supabase
        .from('freelancer_skills')
        .insert(rest)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },
  
  // Get freelancer's skills/services
  getFreelancerSkills: async (freelancerId: string) => {
    const { data, error } = await supabase
      .from('freelancer_skills')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Delete a freelancer skill/service
  deleteFreelancerSkill: async (skillId: string) => {
    const { error } = await supabase
      .from('freelancer_skills')
      .delete()
      .eq('id', skillId);
    
    if (error) throw error;
    return true;
  },
  
  // Get freelancer's transactions
  getTransactions: async (freelancerId: string) => {
    const { data, error } = await supabase
      .from('quickhire_transactions')
      .select(`
        *,
        customer:customer_id(id, name),
        job:job_id(id, title, description)
      `)
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Mark job as completed
  completeJob: async (jobId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Subscribe to job application status changes
  subscribeToApplicationUpdates: (freelancerId: string, callback: (application: JobApplication) => void) => {
    return supabase
      .channel(`freelancer-applications-${freelancerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: `freelancer_id=eq.${freelancerId}`
        },
        (payload) => {
          // Fetch the complete application data with job details
          supabase
            .from('job_applications')
            .select(`
              *,
              job:job_id(id, title, description, budget, customer_id, status, deadline, 
                customer:customer_id(id, name, avatar_url))
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                callback(data as JobApplication);
              }
            });
        }
      )
      .subscribe();
  },
  
  // Subscribe to new jobs
  subscribeToNewJobs: (callback: (job: FreelanceJob) => void) => {
    return supabase
      .channel('new-freelance-jobs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'freelance_jobs'
        },
        (payload) => {
          // Fetch the complete job data with customer details
          supabase
            .from('freelance_jobs')
            .select(`
              *,
              customer:customer_id(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                callback(data as FreelanceJob);
              }
            });
        }
      )
      .subscribe();
  }
}; 