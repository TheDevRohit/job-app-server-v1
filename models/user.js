const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, unique: true, sparse: true },
  name: { type: String },
  email: { type: String, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String }, // Optional if using social login
  image: {
    type: String,
  },
  provider: {
    type: String,
    enum: ['google', 'facebook', 'apple', 'local'],
    default: 'local'
  },
  userType: {
    type: String,
    enum: ['admin', 'jobposter', 'user'],
    default: 'user'
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  favoriteJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  resume: { type: String },
  openToWork: { type: Boolean, default: true },
  instagram: { type: String },
  twitter: { type: String },
  aboutMe: { type: String },
  achievement: { type: String },
  jobType: { type: String },
  jobLevel: { type: String },
  jobTitle: { type: String },
  preferredLocation: { type: String },
  github: { type: String },
  linkedin: { type: String },
  portfolio: { type: String },
  skills: [{ type: String }],
  experience: { type: String },
  education: [{ type: String }],
  location: { type: String },
  language: { type: String },
  isNew: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
