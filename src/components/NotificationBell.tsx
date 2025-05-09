import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/context/NotificationContext';
import { format } from 'date-fns';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const handleNotificationClick = (notification: any) => {
    // Mark notification as read
    markAsRead(notification.id);
    
    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
    }
    
    setOpen(false);
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>;
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-0 h-8 w-8 relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell; 