import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  immediateRefreshNotifications: () => Promise<void>; // ✅ Immediate refresh without rate limiting
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

  // ✅ Immediate refresh notifications (no rate limiting) - for immediate updates after plan creation
  const immediateRefreshNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Immediately fetch notifications and unread count without any rate limiting
      await fetchNotifications({ page: 1, limit: 20, includeRead: true });
      await fetchUnreadCount();
      console.log('✅ Notifications refreshed immediately');
    } catch (err: any) {
      console.error('⚠️ Failed to immediately refresh notifications:', err);
      // Silently fail - don't show toast for background refresh
    }
  };

  // Refresh notifications (force reload) with rate limiting - once per day
  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Check rate limit - only allow one fetch per day
      const RATE_LIMIT_KEY = 'notification_refresh_last_fetch_date';
      const lastFetchDateStr = await AsyncStorage.getItem(RATE_LIMIT_KEY);
      
      if (lastFetchDateStr) {
        const lastFetchDate = new Date(lastFetchDateStr);
        const today = new Date();
        
        // Reset time to midnight for accurate day comparison
        lastFetchDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        // Check if same day
        if (lastFetchDate.getTime() === today.getTime()) {
          // Already fetched today - show message and return
          showToast('info', 'You can only refresh notifications once per day. Please try again tomorrow.');
          return;
        }
      }
      
      // Rate limit passed - proceed with fetch
      await fetchNotifications({ page: 1, limit: 20, includeRead: true });
      
      // Store today's date as last fetch date
      const todayStr = new Date().toISOString();
      await AsyncStorage.setItem(RATE_LIMIT_KEY, todayStr);
      
      showToast('success', 'Notifications refreshed');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to refresh notifications');
    }
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
        
        // Show success message
        showToast('success', 'Notification marked as read');
      } else {
        showToast('error', result.error || 'Failed to mark notification as read');
      }
    } catch (err: any) {
      showToast('error', err.message || 'An error occurred');
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
        showToast('success', 'All notifications marked as read');
      } else {
        showToast('error', result.error || 'Failed to mark all notifications as read');
      }
    } catch (err: any) {
      showToast('error', err.message || 'An error occurred');
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
        
        showToast('success', 'Notification deleted');
      } else {
        showToast('error', result.error || 'Failed to delete notification');
      }
    } catch (err: any) {
      showToast('error', err.message || 'An error occurred');
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
    }
  };

  // Effect to fetch notifications when user logs in
  // ✅ CRITICAL FIX: Changed condition from `isAuthenticated && user` to just `isAuthenticated`
  // This ensures notifications load even when user profile hasn't been fetched yet
  // (e.g., user created account but didn't fill profile, or API is slow)
  useEffect(() => {
    if (isAuthenticated) {
      // ✅ CRITICAL: Load notifications even if user object is null
      // User object might be null if profile fetch failed or is still loading
      // But user is still authenticated (has valid token)
      fetchNotifications();
      // Initialize push notifications
      pushNotificationService.initialize().then(() => {
        // Push notifications initialized
      });
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      // Clean up push notification listeners
      pushNotificationService.cleanup();
    }
  }, [isAuthenticated]); // ✅ Removed `user` from dependencies - notifications should load based on auth only

  // ✅ OPTIMIZATION: Removed 30-second polling interval
  // REASON: With 4,000 users, this creates 11.5M API calls per day!
  // SOLUTION: 
  //   - Notification count loads once on app start (useNotificationCount hook)
  //   - Users can manually refresh in NotificationModal (limited to once per day)
  //   - Push notifications will alert users of new notifications
  // REMOVED CODE:
  //   useEffect(() => {
  //     const interval = setInterval(() => fetchUnreadCount(), 30000);
  //     return () => clearInterval(interval);
  //   }, [isAuthenticated]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    refreshNotifications,
    immediateRefreshNotifications, // ✅ Export immediate refresh function
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