const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email : {type : String},
  mobile: { type: String,  unique: true },
  password: { type: String },
  image : {type : String , default : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'},
  userType: { type: String, enum: ['admin', 'jobposter', 'user'], default: 'user' },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  favoriteJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  resume: { type: String }, 
  openToWork : {type : Boolean , default : true},
  instagram : {type : String},
  twitter : {type : String},
  jobTitle : {type : String},
  preferredLocation : {type : String},
  github : {type : String},
  linkedin : {type : String},
  portfolio : {type : String},
  skills : [{type : String}],
  experience : {type : String},
  education : [{type : String}],
  location : {type : String},
  language : {type : String},
  isNew : {type : Boolean , default : true},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
