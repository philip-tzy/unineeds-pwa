import { supabase } from '@/integrations/supabase/client';

interface RatingData {
  driverId: string;
  tripId: string;
  rating: number;
  comment?: string;
  userId: string;
}

/**
 * Submit a rating for a driver after completing a trip
 */
export const submitDriverRating = async (data: RatingData) => {
  try {
    const { driverId, tripId, rating, comment, userId } = data;
    
    // First, insert the rating
    const { data: ratingData, error: ratingError } = await supabase
      .from('driver_ratings')
      .insert({
        driver_id: driverId,
        trip_id: tripId,
        rating,
        comment,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (ratingError) {
      throw ratingError;
    }
    
    // Then, update the driver's average rating
    // This will trigger the realtime update in the UI
    await updateDriverAverageRating(driverId);
    
    return { success: true, data: ratingData };
  } catch (error) {
    console.error('Error submitting driver rating:', error);
    return { success: false, error };
  }
};

/**
 * Get ratings for a specific driver
 */
export const getDriverRatings = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('driver_ratings')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching driver ratings:', error);
    return { success: false, error };
  }
};

/**
 * Update the driver's average rating
 */
const updateDriverAverageRating = async (driverId: string) => {
  try {
    // Calculate the new average rating
    const { data, error } = await supabase
      .from('driver_ratings')
      .select('rating')
      .eq('driver_id', driverId);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return;
    }
    
    // Calculate average rating
    const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / data.length;
    
    // Update the driver's stats
    const { error: updateError } = await supabase
      .from('driver_stats')
      .update({ rating: averageRating.toFixed(1) })
      .eq('driver_id', driverId);
    
    if (updateError) {
      throw updateError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating driver average rating:', error);
    return { success: false, error };
  }
}; 