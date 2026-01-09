/**
 * ===============================================
 * Firebase Admin Service - Modern FCM v1 Implementation
 * ===============================================
 * 
 * This service replaces the legacy Expo FCM server key approach
 * with modern Firebase Admin SDK using service account authentication.
 * 
 * Benefits:
 * - Works with FCM HTTP v1 API (current standard)
 * - No dependency on deprecated legacy server keys
 * - More reliable and production-ready
 * - Better error handling and logging
 * 
 * Requirements:
 * - Firebase service account JSON file
 * - FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirebaseAdminService {
  constructor() {
    this.initialized = false;
    this.app = null;
    this.initializationError = null;
  }

  /**
   * Initialize Firebase Admin SDK
   * Supports two methods:
   * 1. Service account JSON file path (FIREBASE_SERVICE_ACCOUNT_PATH)
   * 2. Service account JSON string (FIREBASE_SERVICE_ACCOUNT_JSON)
   */
  initialize() {
    // Only initialize once
    if (this.initialized) {
      console.log('🔥 [FIREBASE ADMIN] Already initialized');
      return this.initialized;
    }

    try {
      console.log('🔥 [FIREBASE ADMIN] Initializing Firebase Admin SDK...');
      
      let serviceAccount = null;
      let initMethod = null;

      // Method 1: Load from file path (recommended for VPS)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        console.log('🔥 [FIREBASE ADMIN] Loading service account from file:', serviceAccountPath);
        
        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(`Service account file not found at: ${serviceAccountPath}`);
        }
        
        const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        initMethod = 'FILE';
      }
      // Method 2: Load from environment variable (JSON string)
      else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        console.log('🔥 [FIREBASE ADMIN] Loading service account from environment variable');
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        initMethod = 'ENV_JSON';
      }
      // No configuration found
      else {
        const errorMsg = 'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env';
        console.error('❌ [FIREBASE ADMIN]', errorMsg);
        console.error('❌ [FIREBASE ADMIN] Push notifications will NOT work until this is configured');
        console.error('❌ [FIREBASE ADMIN] See PUSH_NOTIFICATION_FIX.md for setup instructions');
        this.initializationError = errorMsg;
        return false;
      }

      // Validate service account structure
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account JSON: missing required fields (project_id, private_key, client_email)');
      }

      // Initialize Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      this.initialized = true;
      
      console.log('✅ [FIREBASE ADMIN] Firebase Admin SDK initialized successfully');
      console.log('✅ [FIREBASE ADMIN] Initialization method:', initMethod);
      console.log('✅ [FIREBASE ADMIN] Project ID:', serviceAccount.project_id);
      console.log('✅ [FIREBASE ADMIN] Client Email:', serviceAccount.client_email);
      console.log('✅ [FIREBASE ADMIN] FCM push notifications enabled');
      
      return true;
    } catch (error) {
      this.initializationError = error.message;
      console.error('❌ [FIREBASE ADMIN] Failed to initialize Firebase Admin SDK');
      console.error('❌ [FIREBASE ADMIN] Error:', error.message);
      console.error('❌ [FIREBASE ADMIN] Stack:', error.stack);
      console.error('❌ [FIREBASE ADMIN] Push notifications will NOT work');
      console.error('❌ [FIREBASE ADMIN] Please check your service account configuration');
      return false;
    }
  }

  /**
   * Check if Firebase Admin is initialized and ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Get initialization error if any
   */
  getInitializationError() {
    return this.initializationError;
  }

  /**
   * Send push notification to a single FCM token
   * 
   * @param {string} fcmToken - Firebase Cloud Messaging device token
   * @param {Object} notification - Notification payload
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} notification.data - Optional data payload (all values must be strings)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object with success status and messageId or error
   */
  async sendToToken(fcmToken, notification, options = {}) {
    try {
      // Check if initialized
      if (!this.isReady()) {
        console.error('❌ [FCM] Cannot send notification: Firebase Admin not initialized');
        console.error('❌ [FCM] Error:', this.initializationError);
        return {
          success: false,
          error: 'Firebase Admin not initialized',
          details: this.initializationError
        };
      }

      // Validate inputs
      if (!fcmToken) {
        console.error('❌ [FCM] Cannot send notification: FCM token is missing');
        return {
          success: false,
          error: 'FCM token is required'
        };
      }

      if (!notification || !notification.title || !notification.body) {
        console.error('❌ [FCM] Cannot send notification: title and body are required');
        return {
          success: false,
          error: 'Notification title and body are required'
        };
      }

      // Log notification attempt
      console.log('📤 [FCM] Sending notification...');
      console.log('📤 [FCM] Title:', notification.title);
      console.log('📤 [FCM] Body:', notification.body.substring(0, 50) + (notification.body.length > 50 ? '...' : ''));
      console.log('📤 [FCM] Token (first 20 chars):', fcmToken.substring(0, 20) + '...');

      // Prepare FCM message
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: 'purebody-notifications',
            color: '#6366F1',
            sound: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: options.badge || 1,
              contentAvailable: true
            }
          }
        }
      };

      // Add data payload if provided (all values must be strings)
      if (notification.data && typeof notification.data === 'object') {
        message.data = {};
        for (const [key, value] of Object.entries(notification.data)) {
          // Convert all values to strings (FCM requirement)
          message.data[key] = String(value);
        }
        console.log('📤 [FCM] Data payload keys:', Object.keys(message.data).join(', '));
      }

      // Send message via FCM
      const response = await admin.messaging().send(message);

      console.log('✅ [FCM] Notification sent successfully');
      console.log('✅ [FCM] Message ID:', response);

      return {
        success: true,
        messageId: response,
        token: fcmToken.substring(0, 20) + '...' // masked for logs
      };

    } catch (error) {
      console.error('❌ [FCM] Failed to send notification');
      console.error('❌ [FCM] Error code:', error.code);
      console.error('❌ [FCM] Error message:', error.message);

      // Handle specific FCM errors
      let errorDetails = error.message;
      
      if (error.code === 'messaging/invalid-registration-token') {
        errorDetails = 'Invalid FCM token format. Token may be corrupted.';
        console.error('❌ [FCM] The FCM token is invalid or malformed');
      } else if (error.code === 'messaging/registration-token-not-registered') {
        errorDetails = 'FCM token is not registered. User may have uninstalled the app.';
        console.error('❌ [FCM] Device token is no longer valid (app uninstalled?)');
      } else if (error.code === 'messaging/invalid-argument') {
        errorDetails = 'Invalid message payload. Check notification format.';
        console.error('❌ [FCM] Message payload is invalid:', error.message);
      } else if (error.code === 'messaging/authentication-error') {
        errorDetails = 'Firebase authentication failed. Check service account credentials.';
        console.error('❌ [FCM] Authentication error - service account may be invalid');
      } else if (error.code === 'messaging/server-unavailable') {
        errorDetails = 'FCM server temporarily unavailable. Retry later.';
        console.error('❌ [FCM] FCM servers are temporarily unavailable');
      }

      return {
        success: false,
        error: error.code || 'unknown_error',
        details: errorDetails,
        originalError: error.message
      };
    }
  }

  /**
   * Send push notification to multiple FCM tokens (batch send)
   * 
   * @param {Array<string>} fcmTokens - Array of FCM device tokens
   * @param {Object} notification - Notification payload (same as sendToToken)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object with success/failure counts
   */
  async sendToMultipleTokens(fcmTokens, notification, options = {}) {
    try {
      if (!this.isReady()) {
        console.error('❌ [FCM BATCH] Cannot send notifications: Firebase Admin not initialized');
        return {
          success: false,
          error: 'Firebase Admin not initialized'
        };
      }

      if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
        console.error('❌ [FCM BATCH] No tokens provided');
        return {
          success: false,
          error: 'No FCM tokens provided'
        };
      }

      console.log(`📤 [FCM BATCH] Sending notification to ${fcmTokens.length} devices...`);

      // Prepare multicast message
      const message = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: 'purebody-notifications',
            color: '#6366F1',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: options.badge || 1
            }
          }
        }
      };

      // Add data payload if provided
      if (notification.data && typeof notification.data === 'object') {
        message.data = {};
        for (const [key, value] of Object.entries(notification.data)) {
          message.data[key] = String(value);
        }
      }

      // Send multicast message
      const response = await admin.messaging().sendEachForMulticast(message);

      console.log('✅ [FCM BATCH] Batch send completed');
      console.log('✅ [FCM BATCH] Success count:', response.successCount);
      console.log('❌ [FCM BATCH] Failure count:', response.failureCount);

      // Log failed tokens for debugging
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`❌ [FCM BATCH] Failed for token ${idx}:`, resp.error?.code);
          }
        });
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };

    } catch (error) {
      console.error('❌ [FCM BATCH] Batch send failed');
      console.error('❌ [FCM BATCH] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate an FCM token
   * Attempts a dry-run send to check if token is valid
   * 
   * @param {string} fcmToken - FCM token to validate
   * @returns {Promise<boolean>} true if valid, false otherwise
   */
  async validateToken(fcmToken) {
    try {
      if (!this.isReady()) {
        return false;
      }

      if (!fcmToken) {
        return false;
      }

      // Perform a dry-run send
      const message = {
        token: fcmToken,
        notification: {
          title: 'Test',
          body: 'Validation'
        }
      };

      await admin.messaging().send(message, true); // true = dry run
      return true;
    } catch (error) {
      console.log('⚠️ [FCM] Token validation failed:', error.code);
      return false;
    }
  }
}

// Create singleton instance
const firebaseAdminService = new FirebaseAdminService();

// Initialize on module load
firebaseAdminService.initialize();

module.exports = firebaseAdminService;
