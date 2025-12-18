const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create a new Expo SDK client
const expo = new Expo();

class PushNotificationService {
  /**
   * Send push notification to a specific user
   * @param {string} userId - The user ID
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {Object} notification.data - Additional data
   */
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      return await this.sendToToken(user.pushToken, notification);
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a specific token
   * @param {string} pushToken - The push token
   * @param {Object} notification - Notification data
   */
  async sendToToken(pushToken, notification) {
    try {
      // Check that the push token is valid
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return { success: false, reason: 'Invalid token' };
      }

      // Construct the message with Pure Body branding
      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title || 'Pure Body',
        body: notification.body || 'You have a new notification',
        data: {
          ...notification.data,
          appName: 'Pure Body',
          appIcon: 'primeform-logo'
        },
        badge: notification.badge || 1,
        // Pure Body branding
        channelId: 'primeform-notifications',
        categoryId: 'primeform',
        // Custom icon and color for Android
        android: {
          channelId: 'primeform-notifications',
          color: '#6366F1', // Pure Body primary color
          sound: 'default',
          priority: 'high',
          vibrate: [0, 250, 250, 250],
          // Note: Icon paths are configured in app.json, not here
        },
        // iOS specific settings
        ios: {
          sound: 'default',
          badge: notification.badge || 1,
          _displayInForeground: true,
          categoryId: 'primeform'
        }
      };

      // Send the notification
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Check for errors in tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message);
          if (ticket.details && ticket.details.error) {
            console.error('Error details:', ticket.details.error);
          }
        }
      }

      console.log('✅ Push notification sent successfully:', notification.title);
      return { success: true, tickets };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notifications to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  async sendToMultipleUsers(userIds, notification) {
    try {
      const users = await User.find({ 
        _id: { $in: userIds }, 
        pushToken: { $exists: true, $ne: null } 
      });

      const messages = users.map(user => ({
        to: user.pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge || 1,
      })).filter(message => Expo.isExpoPushToken(message.to));

      if (messages.length === 0) {
        console.log('No valid push tokens found for users');
        return { success: false, reason: 'No valid tokens' };
      }

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      console.log(`✅ Push notifications sent to ${messages.length} users`);
      return { success: true, tickets, sentCount: messages.length };
    } catch (error) {
      console.error('Error sending push notifications to multiple users:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle push notification receipts
   * @param {Array} receiptIds - Array of receipt IDs
   */
  async handleReceipts(receiptIds) {
    try {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            
            if (receipt.status === 'error') {
              console.error('Push notification receipt error:', receipt.message);
              
              if (receipt.details && receipt.details.error) {
                console.error('Receipt error details:', receipt.details.error);
                
                // Handle specific errors
                if (receipt.details.error === 'DeviceNotRegistered') {
                  // Remove the push token from the user
                  console.log('Device not registered, should remove push token');
                }
              }
            }
          }
        } catch (error) {
          console.error('Error getting push notification receipts:', error);
        }
      }
    } catch (error) {
      console.error('Error handling push notification receipts:', error);
    }
  }
}

module.exports = new PushNotificationService();