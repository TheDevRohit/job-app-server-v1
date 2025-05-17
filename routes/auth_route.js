const express = require('express');
const router = express.Router();
const userController = require('../controllers/auth_controller');

// Signup with password or phone
router.post('/signup', userController.signup);

// Login with password or phone
router.post('/login', userController.login);

// Send OTP
router.post('/send-otp', userController.sendOTP);

// Verify OTP
router.post('/verify-otp', userController.verifyOtp);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

// Update Profile (auth required)
router.put('/update-profile', userController.updateProfile);

// Upload Resume (auth required)
router.post('/upload-resume', userController.uploadResume);

// Get Resume (auth required)
router.get('/get-resume', userController.getResume);

// Apply for job (auth required)
router.post('/apply-job', userController.applyJob);

// Favorite Jobs CRUD
router.post('/favorite-job/:jobId', userController.addFavorite);
router.delete('/favorite-job/:jobId', userController.removeFavorite);
router.get('/favorite-jobs', userController.getFavorites);

module.exports = router;
