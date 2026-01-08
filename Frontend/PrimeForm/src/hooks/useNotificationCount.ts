import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

/**
 * Custom hook to manage notification count across all pages
 * ✅ OPTIMIZED: No auto-refresh to avoid DB load
 * ✅ Manual refresh available via refresh() function
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
    // Initial fetch only on mount
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
}
