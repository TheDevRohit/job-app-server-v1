const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: { type: String, required: true },
  commentedAt: { type: Date, default: Date.now },
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String],
  authorName: {type : String},
  image: {type : String},
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  comments: [commentSchema],
  status: { type: String, default: 'published', enum: ['published', 'draft'] },
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
