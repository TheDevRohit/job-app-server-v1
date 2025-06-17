const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  content: String,
  url: { type: String, required: true, unique: true },
  image: String,
  publishedAt: Date,
  source: {
    name: String,
    url: String
  }
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
