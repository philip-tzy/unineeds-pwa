import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDriverEarningsSummary } from '@/api/driver/earnings';
import { getDriverRatings } from '@/api/driver/rating';

interface DriverStatsData {
  earnings: string;
  rating: number;
  completedRides: number;
  completedDeliveries: number;
  activedays: number;
  acceptanceRate: number;
  distance: number;
  isLoading: boolean;
}

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  isLoading: boolean;
}

/**
 * Custom hook for realtime driver stats data
 */
export const useDriverStats = (driverId: string | undefined) => {
  const [driverStats, setDriverStats] = useState<DriverStatsData>({
    earnings: '0.00',
    rating: 0,
    completedRides: 0,
    completedDeliveries: 0,
    activedays: 0,
    acceptanceRate: 0,
    distance: 0,
    isLoading: true
  });
  
  useEffect(() => {
    if (!driverId) return;
    
    const fetchDriverStats = async () => {
      try {
        // Fetch driver stats from Supabase
        const { data, error } = await supabase
          .from('driver_stats')
          .select('*')
          .eq('driver_id', driverId)
          .single();
          
        if (error) {
          console.error('Error fetching driver stats:', error);
        } else if (data) {
          setDriverStats({
            earnings: (data.today_earnings || 0).toFixed(2),
            rating: data.rating || 0,
            completedRides: data.completed_rides || 0,
            completedDeliveries: data.completed_deliveries || 0,
            activedays: data.active_days || 0,
            acceptanceRate: data.acceptance_rate || 0,
            distance: data.total_distance || 0,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error in useDriverStats hook:', error);
      } finally {
        setDriverStats(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchDriverStats();
    
    // Set up realtime listener
    const statsSubscription = supabase
      .channel('driver_stats_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_stats',
        filter: `driver_id=eq.${driverId}`
      }, (payload) => {
        console.log('Driver stats changed:', payload);
        if (payload.new) {
          const newData = payload.new;
          setDriverStats({
            earnings: (newData.today_earnings || 0).toFixed(2),
            rating: newData.rating || 0,
            completedRides: newData.completed_rides || 0,
            completedDeliveries: newData.completed_deliveries || 0,
            activedays: newData.active_days || 0,
            acceptanceRate: newData.acceptance_rate || 0,
            distance: newData.total_distance || 0,
            isLoading: false
          });
        }
      })
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      statsSubscription.unsubscribe();
    };
  }, [driverId]);
  
  return driverStats;
};

/**
 * Custom hook for realtime driver earnings data
 */
export const useDriverEarnings = (driverId: string | undefined) => {
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    isLoading: true
  });
  
  useEffect(() => {
    if (!driverId) return;
    
    const fetchEarnings = async () => {
      try {
        const result = await getDriverEarningsSummary(driverId);
        
        if (result.success && result.data) {
          setEarnings({
            today: result.data.today_earnings || 0,
            week: result.data.weekly_earnings || 0,
            month: result.data.monthly_earnings || 0,
            total: result.data.total_earnings || 0,
            isLoading: false
          });
        } else {
          setEarnings({
            today: 0,
            week: 0,
            month: 0,
            total: 0,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error in useDriverEarnings hook:', error);
        setEarnings(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchEarnings();
    
    // Set up realtime listener
    const earningsSubscription = supabase
      .channel('driver_earnings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_earnings',
        filter: `driver_id=eq.${driverId}`
      }, (payload) => {
        console.log('Earnings data changed:', payload);
        if (payload.new) {
          const newData = payload.new;
          setEarnings({
            today: newData.today_earnings || 0,
            week: newData.weekly_earnings || 0,
            month: newData.monthly_earnings || 0,
            total: newData.total_earnings || 0,
            isLoading: false
          });
        }
      })
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      earningsSubscription.unsubscribe();
    };
  }, [driverId]);
  
  return earnings;
};

/**
 * Custom hook for realtime driver ratings
 */
export const useDriverRatings = (driverId: string | undefined) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!driverId) return;
    
    const fetchRatings = async () => {
      try {
        const result = await getDriverRatings(driverId);
        
        if (result.success && result.data) {
          setRatings(result.data);
        }
      } catch (error) {
        console.error('Error in useDriverRatings hook:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRatings();
    
    // Set up realtime listener
    const ratingsSubscription = supabase
      .channel('driver_ratings_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_ratings',
        filter: `driver_id=eq.${driverId}`
      }, (payload) => {
        console.log('New rating:', payload);
        if (payload.new) {
          setRatings(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      ratingsSubscription.unsubscribe();
    };
  }, [driverId]);
  
  return { ratings, isLoading };
}; 