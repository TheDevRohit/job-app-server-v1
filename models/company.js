const mongoose = require('mongoose');

const founderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: String,
  linkedin: String,
  photo: String,
  bio: String,
});

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: String,
  email: String,
  phone: String,
  linkedin: String,
  profileImage: String,
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  website: String,
  logo: String,
  size: String, // e.g. "11-50", "51-200"
  type: String, // e.g. "Startup", "MNC"
  industry: String,
  location: String,
  email: String,
  phone: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Array of Job references
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

  // Founders & Employees
  founders: [founderSchema],
  employees: [employeeSchema],

  // Additional details
  fundingStage: String, // e.g., Seed, Series A, Bootstrapped
  yearFounded: Number,
  headquarters: String,
  socialLinks: {
    linkedin: String,
    twitter: String,
    instagram: String,
    facebook: String,
  },
  perksAndBenefits: [String], // e.g., ["Health Insurance", "Work from Home", "Flexible Hours"]
  mission: String,
  vision: String,
  values: [String],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);
