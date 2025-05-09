import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      // Subscribe to notifications table for real-time updates
      const notificationSubscription = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Add new notification to state
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default'
            });
          }
        )
        .subscribe();
      
      // Subscribe to QuickHire relevant tables for the user
      let quickhireSubscription;
      if (user.role === 'customer') {
        // For customers, subscribe to job applications
        quickhireSubscription = supabase
          .channel('customer-job-applications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'job_applications',
              filter: `job_id=in.(select id from freelance_jobs where customer_id=eq.${user.id})`
            },
            async (payload) => {
              // A new application has been submitted for the customer's job
              const { data: jobData } = await supabase
                .from('freelance_jobs')
                .select('title')
                .eq('id', payload.new.job_id)
                .single();
              
              const { data: freelancerData } = await supabase
                .from('users')
                .select('name')
                .eq('id', payload.new.freelancer_id)
                .single();
              
              toast({
                title: 'New Job Application',
                description: `${freelancerData?.name || 'A freelancer'} has applied for your job: ${jobData?.title || 'your job'}`,
              });
            }
          )
          .subscribe();
      } else if (user.role === 'freelancer') {
        // For freelancers, subscribe to job application status changes
        quickhireSubscription = supabase
          .channel('freelancer-applications')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'job_applications',
              filter: `freelancer_id=eq.${user.id}`
            },
            async (payload) => {
              // Application status has changed
              if (payload.new.status !== payload.old.status) {
                const { data: jobData } = await supabase
                  .from('freelance_jobs')
                  .select('title')
                  .eq('id', payload.new.job_id)
                  .single();
                
                toast({
                  title: `Application ${payload.new.status.charAt(0).toUpperCase() + payload.new.status.slice(1)}`,
                  description: `Your application for "${jobData?.title || 'a job'}" has been ${payload.new.status}`,
                  variant: payload.new.status === 'accepted' ? 'default' : 'destructive'
                });
              }
            }
          )
          .subscribe();
      }
      
      // Clean up subscriptions
      return () => {
        notificationSubscription.unsubscribe();
        if (quickhireSubscription) quickhireSubscription.unsubscribe();
      };
    }
  }, [user, toast]);

  const refreshNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 