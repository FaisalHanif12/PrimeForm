const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware.protect);

// GET /api/notifications - Get all notifications for user
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// POST /api/notifications/bulk - Bulk operations on notifications
router.post('/bulk', notificationController.bulkOperations);

// POST /api/notifications/test - Create test notification (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', notificationController.createTestNotification);
}

// PATCH /api/notifications/:notificationId/read - Mark specific notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// DELETE /api/notifications/:notificationId - Delete specific notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;