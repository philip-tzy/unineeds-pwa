import { supabase } from '@/integrations/supabase/client';

// Function to subscribe to a user's notifications (ride updates)
export const subscribeToUserNotifications = (
  userId: string, 
  onOrderUpdate: (payload: any) => void
) => {
  // Subscribe to order updates for this user
  const orderChannel = supabase
    .channel(`order-updates-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${userId}`
      },
      (payload) => {
        console.log('Order update notification:', payload);
        onOrderUpdate(payload);
      }
    )
    .subscribe();

  // Subscribe to ride request updates for this user
  const rideChannel = supabase
    .channel(`ride-updates-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_requests',
        filter: `customer_id=eq.${userId}`
      },
      (payload) => {
        console.log('Ride request update notification:', payload);
        onOrderUpdate(payload);
      }
    )
    .subscribe();

  // Return a function to unsubscribe
  return () => {
    orderChannel.unsubscribe();
    rideChannel.unsubscribe();
  };
};

// Function to broadcast a notification to a specific user
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      });

    if (error) {
      console.error('Error sending notification:', error);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

// Function to get user notifications
export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}; 