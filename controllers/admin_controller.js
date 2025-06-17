const User = require('../models/user');
const Job = require('../models/job');
const Notification = require('../models/notification');

exports.getAdminDashboardStats = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalNotifications = await Notification.countDocuments();

    // Aggregate total applied jobs from all users
    // Sum lengths of appliedJobs arrays in users collection
    const usersAppliedJobs = await User.aggregate([
      { $project: { appliedCount: { $size: { $ifNull: ['$appliedJobs', []] } } } },
      { $group: { _id: null, totalApplied: { $sum: '$appliedCount' } } },
    ]);
    const totalAppliedJobs = usersAppliedJobs[0]?.totalApplied || 0;

    // Aggregate total favorite jobs from all users
    const usersFavoriteJobs = await User.aggregate([
      { $project: { favoriteCount: { $size: { $ifNull: ['$favoriteJobs', []] } } } },
      { $group: { _id: null, totalFavorite: { $sum: '$favoriteCount' } } },
    ]);
    const totalSavedJobs = usersFavoriteJobs[0]?.totalFavorite || 0;

    res.json({
      totalUsers,
      totalJobs,
      totalAppliedJobs,
      totalSavedJobs,
      totalNotifications,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
  
};


exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await User.find({}, '-password').lean(); // exclude password
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.find({}).lean();
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllAppliedJobs = async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all users with appliedJobs field only
    const users = await User.find({}, 'appliedJobs').lean();

    // Flatten all appliedJobs IDs
    const allAppliedJobIds = users.flatMap(user => user.appliedJobs || []).map(id => id.toString());

    // Get unique IDs
    const uniqueAppliedJobIds = [...new Set(allAppliedJobIds)];

    // Fetch job details
    const appliedJobs = await Job.find({ _id: { $in: uniqueAppliedJobIds } }).lean();

    res.json({ appliedJobs });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

