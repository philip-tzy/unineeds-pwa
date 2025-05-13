import { supabase } from '@/integrations/supabase/client';

export interface FreelancerMetrics {
  id: string;
  freelancer_id: string;
  active_jobs: number;
  completed_jobs: number;
  total_earnings: number;
  available_balance: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the current metrics for a freelancer
 */
export const getFreelancerMetrics = async (freelancerId: string): Promise<FreelancerMetrics | null> => {
  try {
    const { data, error } = await supabase
      .from('freelancer_metrics')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .single();
    
    if (error) {
      console.error('Error fetching freelancer metrics:', error);
      
      // If the error is because the record doesn't exist,
      // we'll initialize one by calling the update function
      if (error.code === 'PGRST116') {
        await initializeFreelancerMetrics(freelancerId);
        
        // Try fetching again
        const { data: retryData, error: retryError } = await supabase
          .from('freelancer_metrics')
          .select('*')
          .eq('freelancer_id', freelancerId)
          .single();
        
        if (retryError) {
          console.error('Error fetching metrics after initialization:', retryError);
          return null;
        }
        
        return retryData;
      }
      
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error fetching freelancer metrics:', error);
    return null;
  }
};

/**
 * Initialize or update metrics for a freelancer
 */
export const initializeFreelancerMetrics = async (freelancerId: string): Promise<boolean> => {
  try {
    // Call the stored procedure to update freelancer metrics
    const { error } = await supabase.rpc('update_freelancer_metrics', {
      p_freelancer_id: freelancerId
    });
    
    if (error) {
      console.error('Error initializing freelancer metrics:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error initializing freelancer metrics:', error);
    return false;
  }
};

/**
 * Subscribe to real-time updates of freelancer metrics
 */
export const subscribeToFreelancerMetrics = (
  freelancerId: string,
  callback: (metrics: FreelancerMetrics) => void
) => {
  const channel = supabase
    .channel(`freelancer_metrics:${freelancerId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'freelancer_metrics',
      filter: `freelancer_id=eq.${freelancerId}`
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as FreelancerMetrics);
      }
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get active jobs for a freelancer
 */
export const getActiveJobs = async (freelancerId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('freelance_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', freelancerId)
      .eq('status', 'in_progress');
    
    if (error) {
      console.error('Error fetching active jobs count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching active jobs count:', error);
    return 0;
  }
};

/**
 * Get total earnings for a freelancer
 */
export const getTotalEarnings = async (freelancerId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('quickhire_transactions')
      .select('amount')
      .eq('freelancer_id', freelancerId)
      .eq('status', 'completed');
    
    if (error) {
      console.error('Error fetching earnings:', error);
      return 0;
    }
    
    // Sum up all transaction amounts
    const total = data.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);
    return total;
  } catch (error) {
    console.error('Unexpected error fetching earnings:', error);
    return 0;
  }
};

/**
 * Get average rating for a freelancer
 */
export const getAverageRating = async (freelancerId: string): Promise<{ rating: number, count: number }> => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('recipient_id', freelancerId)
      .eq('service_type', 'quickhire');
    
    if (error) {
      console.error('Error fetching ratings:', error);
      return { rating: 0, count: 0 };
    }
    
    if (data.length === 0) {
      return { rating: 0, count: 0 };
    }
    
    // Calculate average rating
    const total = data.reduce((sum, rating) => sum + rating.rating, 0);
    const average = total / data.length;
    
    return { 
      rating: parseFloat(average.toFixed(1)), 
      count: data.length 
    };
  } catch (error) {
    console.error('Unexpected error fetching ratings:', error);
    return { rating: 0, count: 0 };
  }
}; 