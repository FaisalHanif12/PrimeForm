import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

/**
 * Custom hook to manage notification count across all pages
 * ✅ OPTIMIZED: Event-driven updates via push notifications instead of polling
 * ✅ Manual refresh available via refresh() function
 * ✅ Eliminates excessive DB queries by only fetching when notifications arrive
 */
export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('🔔 [NOTIFICATION COUNT] Fetching unread notification count...');
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        console.log('✅ [NOTIFICATION COUNT] Unread count fetched:', response.unreadCount);
        setUnreadCount(response.unreadCount);
      } else {
        console.error('❌ [NOTIFICATION COUNT] Failed to fetch count:', response.error);
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION COUNT] Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    fetchUnreadCount();

    // ✅ OPTIMIZATION: Listen for push notifications instead of polling
    // This eliminates excessive DB queries by only fetching when new notifications arrive
    import('expo-notifications').then((Notifications) => {
      // Listen for notifications received while app is in foreground or background
      const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log('🔔 [NOTIFICATION COUNT HOOK] New notification received, refreshing count...');
        // Event-driven update - only fetch when notification arrives
        fetchUnreadCount();
      });

      // Listen for when user taps on notification
      const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('🔔 [NOTIFICATION COUNT HOOK] Notification tapped, refreshing count...');
        fetchUnreadCount();
      });

      // Cleanup listeners on unmount
      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }).catch((error) => {
      // Fallback for web or environments where expo-notifications is not available
      console.log('⚠️ [NOTIFICATION COUNT HOOK] Expo Notifications not available, skipping listener setup');
    });
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
}
