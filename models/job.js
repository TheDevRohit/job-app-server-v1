const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: true,
  },
  jobLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Lead'],
  },
  duration: { type: String },
  skillsRequired: [{ type: String }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  url: { type: String },
  applicationLink: { type: String },
  hrEmail: { type: String, required: true },
  benifits: [{ type: String }],
  perks: [{ type: String }],
  aboutRole: { type: String },
  aboutCompany: { type: String },
  companyLogo: { type: String },
  companyWebsite: { type: String },
  companySize: { type: String },
  companyType: { type: String },
  industry: { type: String },
  lookingFor: { type: String },
  education: { type: String },
  experience: { type: String },
  applyBy: { type: Date },
  deadline: { type: Date },
  rolesAndRes: { type: String },
  language: {
    type: [String],
    default: [],
  },
  remote: { type: Boolean, default: false },
  locationType: {
    type: [String],
    enum: ['Remote', 'Hybrid', 'Onsite'],
    default: [],
  },
  isNew: { type: Boolean, default: true },
  openings: { type: Number, default: 1 },
  tags: [{ type: String }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
