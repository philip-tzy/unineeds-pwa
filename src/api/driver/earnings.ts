import { supabase } from '@/integrations/supabase/client';

interface EarningsUpdateData {
  driverId: string;
  amount: number;
  tripId: string;
  orderType: 'unimove' | 'unisend';
  customerName: string;
  orderId: string;
}

/**
 * Update driver earnings after completing a trip or delivery
 */
export const updateDriverEarnings = async (data: EarningsUpdateData) => {
  try {
    const { driverId, amount, tripId, orderType, customerName, orderId } = data;
    
    // First, add a new transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from('driver_transactions')
      .insert({
        driver_id: driverId,
        amount,
        status: 'completed',
        created_at: new Date().toISOString(),
        order_type: orderType,
        customer_name: customerName,
        order_id: orderId,
        trip_id: tripId
      })
      .select()
      .single();
    
    if (transactionError) {
      throw transactionError;
    }
    
    // Then, update the driver's earnings summary
    // This will update today, week, month, and total earnings
    await updateDriverEarningsSummary(driverId, amount);
    
    // Also update the driver's stats
    await updateDriverStats(driverId, orderType);
    
    return { success: true, data: transactionData };
  } catch (error) {
    console.error('Error updating driver earnings:', error);
    return { success: false, error };
  }
};

/**
 * Get a driver's transaction history
 */
export const getDriverTransactions = async (driverId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('driver_transactions')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching driver transactions:', error);
    return { success: false, error };
  }
};

/**
 * Get driver's earnings summary
 */
export const getDriverEarningsSummary = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driverId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching driver earnings summary:', error);
    return { success: false, error };
  }
};

/**
 * Update the driver's earnings summary
 */
const updateDriverEarningsSummary = async (driverId: string, amount: number) => {
  try {
    // Get the current earnings summary
    const { data, error } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driverId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }
    
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate which buckets to update
    const todayEarnings = amount;
    const weeklyEarnings = amount;
    const monthlyEarnings = amount;
    const totalEarnings = amount;
    
    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('driver_earnings')
        .update({
          today_earnings: (data.today_earnings || 0) + todayEarnings,
          weekly_earnings: (data.weekly_earnings || 0) + weeklyEarnings,
          monthly_earnings: (data.monthly_earnings || 0) + monthlyEarnings,
          total_earnings: (data.total_earnings || 0) + totalEarnings,
          updated_at: now.toISOString()
        })
        .eq('driver_id', driverId);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Create a new record
      const { error: insertError } = await supabase
        .from('driver_earnings')
        .insert({
          driver_id: driverId,
          today_earnings: todayEarnings,
          weekly_earnings: weeklyEarnings,
          monthly_earnings: monthlyEarnings,
          total_earnings: totalEarnings,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    // Also update today's earnings in driver_stats
    const { error: statsError } = await supabase
      .from('driver_stats')
      .update({
        today_earnings: data ? (data.today_earnings || 0) + todayEarnings : todayEarnings
      })
      .eq('driver_id', driverId);
    
    if (statsError) {
      throw statsError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating driver earnings summary:', error);
    return { success: false, error };
  }
};

/**
 * Update driver stats after completing a trip or delivery
 */
const updateDriverStats = async (driverId: string, orderType: 'unimove' | 'unisend') => {
  try {
    // First get the current stats
    const { data, error } = await supabase
      .from('driver_stats')
      .select('*')
      .eq('driver_id', driverId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Create an update object based on order type
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (orderType === 'unimove') {
      updateData.completed_rides = data ? (data.completed_rides || 0) + 1 : 1;
    } else if (orderType === 'unisend') {
      updateData.completed_deliveries = data ? (data.completed_deliveries || 0) + 1 : 1;
    }
    
    // Add distance (example: add 5km for each trip/delivery)
    const distanceToAdd = 5; // This would come from the actual trip data
    updateData.total_distance = data ? (data.total_distance || 0) + distanceToAdd : distanceToAdd;
    
    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('driver_stats')
        .update(updateData)
        .eq('driver_id', driverId);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Create a new record
      updateData.driver_id = driverId;
      updateData.created_at = new Date().toISOString();
      
      const { error: insertError } = await supabase
        .from('driver_stats')
        .insert(updateData);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating driver stats:', error);
    return { success: false, error };
  }
}; 