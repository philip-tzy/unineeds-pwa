
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OrderNotification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

/**
 * Subscribes to new orders for a specific seller
 */
export const subscribeToNewOrders = (sellerId: string, callback: (order: any) => void) => {
  const channel = supabase
    .channel('seller-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${sellerId}`
      },
      (payload) => {
        console.log('New order received:', payload);
        callback(payload.new);
        
        // Show toast notification
        toast({
          title: 'New Order Received!',
          description: `Order #${payload.new.id.substring(0, 8)} has been placed.`,
          duration: 5000,
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribes to order status changes
 */
export const subscribeToOrderStatusChanges = (sellerId: string, callback: (order: any) => void) => {
  const channel = supabase
    .channel('order-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${sellerId}`
      },
      (payload) => {
        console.log('Order status updated:', payload);
        callback(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Gets all unread notifications for a seller
 */
export const getSellerNotifications = async (sellerId: string): Promise<OrderNotification[]> => {
  try {
    // In a real app, you would fetch this from a notifications table
    // For now, we'll return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching seller notifications:', error);
    throw error;
  }
};

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    // In a real app, you would update the notification in the database
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};
