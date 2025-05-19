const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification_controller');
const authMiddleware = require('..../middleware/auth_middlewars') // Assuming you have this

// Authenticated routes
router.use(authMiddleware);

// Create notification (admin only)
router.post('/', notificationController.createNotification);

// Get current user's notifications
router.get('/', notificationController.getMyNotifications);

// Mark as read/unread
router.put('/:id/read', notificationController.markAsRead);
router.put('/:id/unread', notificationController.markAsUnread);

// Delete notification (admin only)
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
