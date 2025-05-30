const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // optional: for targeted users
  isGlobal: {
    type: Boolean,
    default: true,
  },
  isClicked: {
    type: Boolean,
    default: false,
  },
  jobId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Notification', notificationSchema);
