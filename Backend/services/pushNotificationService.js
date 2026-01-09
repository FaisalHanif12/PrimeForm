/**
 * ===============================================
 * Push Notification Service - Firebase Admin FCM v1
 * ===============================================
 * 
 * This service provides a unified interface for sending push notifications
 * using Firebase Admin SDK with FCM HTTP v1 API.
 * 
 * MIGRATED FROM: Legacy Expo FCM server key approach
 * MIGRATED TO: Modern Firebase Admin SDK with service account auth
 * 
 * This maintains backward compatibility with existing code while using
 * the new Firebase Admin service under the hood.
 */

const firebaseAdminService = require('./firebaseAdminService');
const User = require('../models/User');

class PushNotificationService {
  /**
   * Send push notification to a specific user
   * 
   * @param {string} userId - The user ID
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} notification.data - Additional data (all values must be strings)
   * @param {number} notification.badge - Badge count (optional)
   * @returns {Promise<Object>} Result object
   */
  async sendToUser(userId, notification) {
    try {
      console.log(`📱 [PUSH] Sending notification to user: ${userId}`);
      
      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        console.log(`⚠️ [PUSH] User not found: ${userId}`);
        return { success: false, reason: 'User not found' };
      }

      // Check if user has pushToken (FCM token)
      if (!user.pushToken) {
        console.log(`⚠️ [PUSH] No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      // Send notification using Firebase Admin
      return await this.sendToToken(user.pushToken, notification);

    } catch (error) {
      console.error('❌ [PUSH] Error sending push notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a specific FCM token
   * 
   * @param {string} pushToken - The FCM push token
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Result object
   */
  async sendToToken(pushToken, notification) {
    try {
      console.log('📱 [PUSH] Sending notification to token...');
      
      // Validate token exists
      if (!pushToken) {
        console.error('❌ [PUSH] Push token is missing');
        return { success: false, reason: 'Invalid token' };
      }

      // Log notification details
      console.log('📱 [PUSH] Title:', notification.title);
      console.log('📱 [PUSH] Body:', notification.body?.substring(0, 50) + '...');

      // Prepare notification payload for Firebase Admin
      const fcmNotification = {
        title: notification.title || 'Pure Body',
        body: notification.body || 'You have a new notification',
        data: {
          // Spread existing data
          ...(notification.data || {}),
          // Add app branding
          appName: 'Pure Body',
          appIcon: 'primeform-logo',
          // Ensure all values are strings (FCM requirement)
        }
      };

      // Convert all data values to strings (FCM requirement)
      if (fcmNotification.data) {
        for (const [key, value] of Object.entries(fcmNotification.data)) {
          fcmNotification.data[key] = String(value);
        }
      }

      // Additional options
      const options = {
        badge: notification.badge || 1,
        priority: 'high'
      };

      // Send via Firebase Admin service
      const result = await firebaseAdminService.sendToToken(
        pushToken,
        fcmNotification,
        options
      );

      if (result.success) {
        console.log('✅ [PUSH] Push notification sent successfully:', notification.title);
        return { 
          success: true, 
          messageId: result.messageId,
          service: 'firebase-admin-fcm-v1'
        };
      } else {
        console.error('❌ [PUSH] Push notification failed:', result.error);
        console.error('❌ [PUSH] Details:', result.details);
        
        // Return detailed error info
        return {
          success: false,
          error: result.error,
          details: result.details,
          service: 'firebase-admin-fcm-v1'
        };
      }

    } catch (error) {
      console.error('❌ [PUSH] Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notifications to multiple users
   * 
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Result object with success/failure counts
   */
  async sendToMultipleUsers(userIds, notification) {
    try {
      console.log(`📱 [PUSH MULTI] Sending notification to ${userIds.length} users...`);
      
      // Get all users with valid push tokens
      const users = await User.find({
        _id: { $in: userIds },
        pushToken: { $exists: true, $ne: null }
      }).select('_id pushToken');

      if (users.length === 0) {
        console.log('⚠️ [PUSH MULTI] No valid push tokens found for users');
        return { success: false, reason: 'No valid tokens' };
      }

      console.log(`📱 [PUSH MULTI] Found ${users.length} users with push tokens`);

      // Extract FCM tokens
      const fcmTokens = users.map(user => user.pushToken);

      // Prepare notification payload
      const fcmNotification = {
        title: notification.title,
        body: notification.body,
        data: {
          ...(notification.data || {}),
          appName: 'Pure Body'
        }
      };

      // Convert all data values to strings
      if (fcmNotification.data) {
        for (const [key, value] of Object.entries(fcmNotification.data)) {
          fcmNotification.data[key] = String(value);
        }
      }

      // Send via Firebase Admin (batch)
      const result = await firebaseAdminService.sendToMultipleTokens(
        fcmTokens,
        fcmNotification,
        { badge: notification.badge || 1 }
      );

      console.log(`✅ [PUSH MULTI] Sent notifications to ${result.successCount}/${users.length} users`);

      return {
        success: result.successCount > 0,
        sentCount: result.successCount,
        failedCount: result.failureCount,
        totalUsers: users.length,
        service: 'firebase-admin-fcm-v1'
      };

    } catch (error) {
      console.error('❌ [PUSH MULTI] Error sending push notifications to multiple users:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle push notification receipts
   * Note: Firebase Admin SDK handles receipts automatically,
   * so this is mainly for logging purposes.
   * 
   * @param {Array} receiptIds - Array of receipt IDs (not used in FCM v1)
   * @returns {Promise<void>}
   */
  async handleReceipts(receiptIds) {
    // Firebase Admin SDK handles delivery confirmations automatically
    // No need to manually check receipts like in Expo legacy system
    console.log('ℹ️ [PUSH] Receipt handling not required with Firebase Admin SDK');
    console.log('ℹ️ [PUSH] Firebase automatically handles delivery confirmations');
    return;
  }

  /**
   * Test push notification functionality
   * Sends a test notification to verify FCM is working
   * 
   * @param {string} userId - User ID to send test notification
   * @returns {Promise<Object>} Result object
   */
  async sendTestNotification(userId) {
    try {
      console.log('🧪 [PUSH TEST] Sending test notification...');
      
      const result = await this.sendToUser(userId, {
        title: '🧪 Test Notification',
        body: 'This is a test notification from Pure Body. If you see this, push notifications are working correctly!',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      });

      if (result.success) {
        console.log('✅ [PUSH TEST] Test notification sent successfully');
      } else {
        console.error('❌ [PUSH TEST] Test notification failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ [PUSH TEST] Test notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service status and configuration
   * Useful for health checks and debugging
   * 
   * @returns {Object} Status information
   */
  getStatus() {
    const isReady = firebaseAdminService.isReady();
    const error = firebaseAdminService.getInitializationError();

    return {
      service: 'Firebase Admin FCM v1',
      initialized: isReady,
      error: error || null,
      legacy: false, // No longer using legacy Expo FCM server key
      method: isReady ? 'Firebase Admin SDK with service account' : 'Not initialized'
    };
  }

  /**
   * Validate if push notifications are properly configured
   * 
   * @returns {boolean} true if configured and ready, false otherwise
   */
  isConfigured() {
    return firebaseAdminService.isReady();
  }
}

// Create and export singleton instance
const pushNotificationService = new PushNotificationService();

// Log initialization status
const status = pushNotificationService.getStatus();
if (status.initialized) {
  console.log('✅ [PUSH SERVICE] Push notifications ready');
  console.log('✅ [PUSH SERVICE] Using:', status.method);
} else {
  console.error('❌ [PUSH SERVICE] Push notifications NOT configured');
  console.error('❌ [PUSH SERVICE] Error:', status.error);
  console.error('❌ [PUSH SERVICE] Users will NOT receive push notifications');
  console.error('❌ [PUSH SERVICE] Please configure Firebase service account');
}

module.exports = pushNotificationService;
