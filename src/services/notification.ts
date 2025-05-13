import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a notification to a specific user
 * 
 * @param userId - The ID of the user to send the notification to
 * @param title - The notification title
 * @param message - The notification message
 * @param type - The type of notification (success, error, info, warning)
 * @param data - Additional data to include with the notification
 * @returns A promise that resolves when the notification is sent
 */
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  data?: any
): Promise<{ success: boolean; error: any }> => {
  try {
    // Insert notification into the notifications table
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        is_read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in sendNotificationToUser:', err);
    return { success: false, error: err };
  }
};

/**
 * Marks a notification as read
 * 
 * @param notificationId - The ID of the notification to mark as read
 * @param userId - The ID of the user who owns the notification (for security)
 * @returns A promise that resolves when the notification is marked as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId); // Security check to ensure only the owner can mark as read

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in markNotificationAsRead:', err);
    return { success: false, error: err };
  }
};

/**
 * Gets all notifications for a user
 * 
 * @param userId - The ID of the user to get notifications for
 * @param limit - The maximum number of notifications to get (default: 20)
 * @param includeRead - Whether to include read notifications (default: false)
 * @returns A promise that resolves to an array of notifications
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  includeRead: boolean = false
): Promise<{ data: any[]; error: any }> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Only include unread notifications if specified
    if (!includeRead) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user notifications:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getUserNotifications:', err);
    return { data: [], error: err };
  }
};

/**
 * Subscribes to new notifications for a user
 * 
 * @param userId - The ID of the user to get notifications for
 * @param onNewNotification - Callback function when a new notification is received
 * @returns A subscription object with methods to unsubscribe
 */
export const subscribeToUserNotifications = (
  userId: string,
  onNewNotification: (notification: any) => void
) => {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('New notification received:', payload);
        if (payload.new) {
          onNewNotification(payload.new);
        }
      }
    )
    .subscribe((status) => {
      console.log(`User notifications subscription status for ${userId}:`, status);
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}; 