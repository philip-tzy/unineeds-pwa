
import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getSellerNotifications, OrderNotification, markNotificationAsRead } from '@/services/food/NotificationService';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const notifications = await getSellerNotifications(user.id);
      setNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full overflow-auto shadow-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Bell className="mr-2 h-5 w-5 text-blue-500" />
            Notifications
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex p-3 border rounded-md">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border rounded-md ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{notification.title}</h3>
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <div className="text-xs text-gray-400 mt-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
