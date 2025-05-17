const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String }, // could be a range or exact
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
  skillsRequired: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  url : {type : String},
  hrEmail : {type : String , required : true},
  benifits : [{type : String}],
  aboutRole : {type : String},
  aboutCompany : {type : String},
  companyLogo : {type : String},
  companyWebsite : {type : String},
  companySize : {type : String},
  companyType : {type : String},
  lookingFor : {type : String}, 
  education : {type : String},
  experience : {type : String},
  applyBy : {type : Date},
  language : {type : String},
  // add any other fields like experience, education, etc.
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);

