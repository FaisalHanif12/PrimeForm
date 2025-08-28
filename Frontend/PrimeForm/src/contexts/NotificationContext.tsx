import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import notificationService from '../services/notificationService';
import pushNotificationService from '../services/pushNotificationService';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Notification {
  _id: string;
  type: 'welcome' | 'diet_plan_created' | 'workout_plan_created' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata: any;
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (options?: any) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
  
  // Utility functions
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (priority: string) => string;
  formatTime: (timestamp: string) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthContext();
  const { showToast } = useToast();

  // Fetch notifications from the server
  const fetchNotifications = async (options = {}) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await notificationService.getNotifications(options);
      
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } else {
        setError(result.error || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications (force reload)
  const refreshNotifications = async () => {
    await fetchNotifications({ page: 1, limit: 20, includeRead: true });
  };

  // Mark a specific notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        showToast(result.error || 'Failed to mark notification as read', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        showToast('All notifications marked as read', 'success');
      } else {
        showToast(result.error || 'Failed to mark all notifications as read', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    }
  };

  // Delete a specific notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      
      if (result.success) {
        // Find the notification to check if it was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        
        // Update local state
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        showToast('Notification deleted', 'success');
      } else {
        showToast(result.error || 'Failed to delete notification', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred', 'error');
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Utility function to get notification icon
  const getNotificationIcon = (type: string): string => {
    return notificationService.getNotificationIcon(type);
  };

  // Utility function to get notification color
  const getNotificationColor = (priority: string): string => {
    return notificationService.getNotificationColor(priority);
  };

  // Utility function to format time
  const formatTime = (timestamp: string): string => {
    return notificationService.formatNotificationTime(timestamp);
  };

  // Fetch unread count periodically
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.unreadCount);
      }
    } catch (err) {
      // Silently fail for background updates
      console.error('Error fetching unread count:', err);
    }
  };

  // Effect to fetch notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      // Initialize push notifications
      pushNotificationService.initialize().then(token => {
        if (token) {
          console.log('✅ Push notifications initialized for user:', user.email);
        } else {
          console.log('❌ Failed to initialize push notifications');
        }
      });
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      // Clean up push notification listeners
      pushNotificationService.cleanup();
    }
  }, [isAuthenticated, user]);

  // Effect to periodically check for new notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up interval to check for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
    getNotificationIcon,
    getNotificationColor,
    formatTime
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;