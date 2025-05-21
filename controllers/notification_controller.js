const Notification = require('../models/notification');

// Create Notification (admin only)
exports.createNotification = async (req, res) => {
  try {
    // if (req.user.userType !== 'admin') {
    //   return res.status(403).json({ message: 'Unauthorized to create notifications' });
    // }

    const { title, message, targetUsers, isGlobal } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const notification = new Notification({
      title,
      message,
      targetUsers: isGlobal ? [] : targetUsers,
      isGlobal,
    });

    await notification.save();

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Notifications for user
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({
      $or: [
        { isGlobal: true },
        { targetUsers: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ message: 'List of notifications', notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (!notification.readBy.includes(req.user.id)) {
      notification.readBy.push(req.user.id);
      await notification.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as unread
exports.markAsUnread = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.readBy = notification.readBy.filter(id => id.toString() !== req.user.id);
    await notification.save();

    res.json({ message: 'Marked as unread' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Notification (admin only)
exports.deleteNotification = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await notification.remove();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
