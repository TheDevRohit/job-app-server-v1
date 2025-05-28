require('dotenv').config(); // Load .env variables

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (customize if needed)
app.use(express.json()); // Parse JSON body

// Import routes
const authRoutes = require('./routes/auth_route');
const jobRoutes = require('./routes/job_route');
const articleRoute = require('./routes/article')
const notificationRoutes = require('./routes/notification_route');
const companyRoute = require('./routes/compnay_routes')
// const userRoutes = require('./routes/user'); // If you have user routes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications' , notificationRoutes)
app.use('/api/article' , articleRoute)
app.use('/api/company', companyRoute)


// Default route
app.get('/', (req, res) => {
  res.send('Job search API is running');
});

// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
