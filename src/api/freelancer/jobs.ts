import { supabase, checkUserRole } from '@/lib/supabase';
import type { Job } from '@/types/database';

export const freelancerJobsApi = {
  // Get all jobs for the current freelancer
  getJobs: async () => {
    const user = await checkUserRole('freelancer');
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('freelancer_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Job[];
  },

  // Get a single job
  getJob: async (jobId: string) => {
    const user = await checkUserRole('freelancer');
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('freelancer_id', user.id)
      .single();
      
    if (error) throw error;
    return data as Job;
  },

  // Create a new job
  createJob: async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
    const user = await checkUserRole('freelancer');
    const { data, error } = await supabase
      .from('jobs')
      .insert([{ ...jobData, freelancer_id: user.id }])
      .select()
      .single();
      
    if (error) throw error;
    return data as Job;
  },

  // Update a job
  updateJob: async (jobId: string, jobData: Partial<Job>) => {
    const user = await checkUserRole('freelancer');
    const { data, error } = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', jobId)
      .eq('freelancer_id', user.id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Job;
  },

  // Delete a job
  deleteJob: async (jobId: string) => {
    const user = await checkUserRole('freelancer');
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('freelancer_id', user.id);
      
    if (error) throw error;
  }
}; 