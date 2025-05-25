const express = require('express');
const router = express.Router();
const userController = require('../controllers/auth_controller');
const auth = require('../middlewares/auth_middlewars');

// Signup with password or phone
router.post('/signup', userController.signup);

// Login with password or phone
router.post('/login', userController.login);

// Send OTP
router.post('/send-otp', userController.sendOTP);

// Verify OTP
router.post('/verify-otp', userController.verifyOtp);

// Verify OTP
router.post('/support', userController.support);

// send email otp
router.post('/send-email-otp' , userController.sendEmailOTP);


// verify email otp
router.post('/verify-email-otp' , userController.verifyEmailOTP);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

router.put('/change-password' , auth , userController.changePassword);


// Update Profile (auth required)
router.put('/update-profile', auth ,userController.updateProfile);

// Upload Resume (auth required)
router.post('/upload-resume', auth , userController.uploadResume);

router.post('/send-mail-hr' , userController.sendMailToHR);


// Get Resume (auth required)
router.get('/get-resume',auth ,userController.getResume);


// Favorite Jobs CRUD
router.post('/favorite-job/:jobId', userController.addFavorite);
router.delete('/favorite-job/:jobId', userController.removeFavorite);
router.get('/favorite-jobs', userController.getFavorites);

module.exports = router;
