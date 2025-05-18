const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String },
  userType: { type: String, enum: ['admin', 'jobposter', 'user'], default: 'user' },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  favoriteJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  resume: { type: String }, 
  openToWork : {type : Boolean , default : true},
  instagram : {type : String},
  twitter : {type : String},
  github : {type : String},
  linkedin : {type : String},
  portfolio : {type : String},
  skills : [{type : String}],
  experience : [{type : String}],
  education : [{type : String}],
  location : {type : String},
  language : {type : String},
  isNew : {type : Boolean , default : true},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
