import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import notificationService from '../services/notificationService';

/**
 * Custom hook to manage notification count across all pages
 * Automatically updates when app comes to foreground
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
    // Initial fetch
    fetchUnreadCount();

    // Set up app state listener to refresh count when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchUnreadCount();
      }
    });

    // Refresh every 30 seconds when app is active
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        fetchUnreadCount();
      }
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
}
