const NotificationService = require('../services/notificationService');

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const {
      page = 1,
      limit = 20,
      includeRead = 'true'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      includeRead: includeRead === 'true'
    };

    const notifications = await NotificationService.getUserNotifications(userId, options);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: options.page,
          limit: options.limit,
          hasMore: notifications.length === options.limit
        }
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    const notification = await NotificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    await NotificationService.markAllAsRead(userId);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'All notifications marked as read',
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a specific notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }

    await NotificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Notification deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const stats = await NotificationService.getNotificationStats(userId);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create a test notification (for development/testing)
exports.createTestNotification = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { title, message, type = 'general', priority = 'medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let notification;
    
    switch (type) {
      case 'welcome':
        notification = await NotificationService.createWelcomeNotification(userId, req.user.fullName);
        break;
      case 'diet_plan_created':
        notification = await NotificationService.createDietPlanNotification(userId);
        break;
      case 'workout_plan_created':
        notification = await NotificationService.createWorkoutPlanNotification(userId);
        break;
      default:
        notification = await NotificationService.createGeneralNotification(userId, title, message, { priority });
    }

    res.status(201).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk operations for notifications
exports.bulkOperations = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { action, notificationIds } = req.body;

    if (!action || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and notification IDs array are required'
      });
    }

    let result;
    
    switch (action) {
      case 'markAsRead':
        result = await Promise.all(
          notificationIds.map(id => NotificationService.markAsRead(id, userId))
        );
        break;
      case 'delete':
        result = await Promise.all(
          notificationIds.map(id => NotificationService.deleteNotification(id, userId))
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: markAsRead, delete'
        });
    }

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: `Bulk ${action} operation completed`,
        processedCount: result.length,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error performing bulk operations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};