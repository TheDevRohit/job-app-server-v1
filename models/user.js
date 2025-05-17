const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String },
  userType: { type: String, enum: ['admin', 'jobposter', 'user'], default: 'user' },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  favoriteJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  resume: { type: String }, // filepath or URL to uploaded resume
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
