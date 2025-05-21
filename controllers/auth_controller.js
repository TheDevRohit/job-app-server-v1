const User = require('../models/user');
const Job = require('../models/job');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { createNotification } = require('./notification_controller');
const Notification = require('../models/notification')
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// For demo: store OTPs here, replace with Redis or DB in prod
const otpStore = {};
const resetTokenStore = {};

// Setup multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage }).single('resume');

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

exports.signup = async (req, res) => {
  try {
    const { name, mobile, password, userType , skill } = req.body;
    if (!name || !mobile || (!password && !req.body.otp)) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = new User({
      name,
      mobile,
      skills : skill,
      image : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      password: hashedPassword,
      userType: userType || 'user', // default user
    });

    await user.save();
    const welcomeNotification = new Notification({
      title: `Hii ${user.name} Welcome to Hirealis}!`, // Replace with your app name
      message: 'Welcome to our community! Explore opportunities and grow your career with us.',
      targetUsers: [user._id],
      isGlobal: false,
    });

    await welcomeNotification.save();
    const token = generateToken(user);
     
    const { password: userPassword, ...userWithoutPassword } = user.toObject();
    res.status(201).json({
        message : "Logged in successfully",
        token,
        user: userWithoutPassword,
      });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, password, otp } = req.body;
    if (!mobile || (!password && !otp)) {
      return res.status(400).json({ message: 'Provide mobile and password or OTP' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    } else if (otp) {
      // Verify OTP
      const record = otpStore[mobile];
      if (!record) return res.status(400).json({ message: 'No OTP sent' });
      if (Date.now() > record.expires) {
        delete otpStore[mobile];
        return res.status(400).json({ message: 'OTP expired' });
      }
      if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
      delete otpStore[mobile];
    } else {
      return res.status(400).json({ message: 'Password or OTP required' });
    }

    const token = generateToken(user);

    const { password: userPassword, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
        message : "Logged in successfully",
        token,
        user: userWithoutPassword,
      });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await client.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });

    otpStore[mobile] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    res.json({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile required' });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ message: 'Mobile not registered' });

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    resetTokenStore[mobile] = { token: resetToken, expires: Date.now() + 15 * 60 * 1000 }; // 15 min

    // Send reset token as OTP for simplicity, you can send email or SMS here
    await client.messages.create({
      body: `Your password reset code is ${resetToken}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });

    res.json({ message: 'Reset token sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { mobile, token, newPassword } = req.body;
    if (!mobile || !token || !newPassword)
      return res.status(400).json({ message: 'All fields required' });

    const record = resetTokenStore[mobile];
    if (!record) return res.status(400).json({ message: 'No reset request found' });
    if (Date.now() > record.expires) {
      delete resetTokenStore[mobile];
      return res.status(400).json({ message: 'Reset token expired' });
    }
    if (record.token !== token) return res.status(400).json({ message: 'Invalid reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ mobile }, { password: hashedPassword });

    delete resetTokenStore[mobile];

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const id  = req.user.id; // Set by auth middleware from JWT
    const updates = req.body;

    // Optionally handle profile image or resume if you're uploading files
    if (req.file) {
      updates.image = req.file.path; // or cloud URL
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = updatedUser.toObject();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

exports.uploadResume = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'Upload error', error: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const userId = req.user.id;
      const resumePath = req.file.path;

      await User.findByIdAndUpdate(userId, { resume: resumePath });

      res.json({ message: 'Resume uploaded', path: resumePath });
    } catch (error) {
      res.status(500).json({ message: 'Failed', error: error.message });
    }
  });
};

exports.getResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resume) return res.status(404).json({ message: 'Resume not found' });

    res.sendFile(path.resolve(user.resume)); // serve the file
  } catch (error) {
    res.status(500).json({ message: 'Failed to get resume', error: error.message });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ message: 'Job ID required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // You can implement applications collection or embedded array.
    // For simplicity, add user ID to job applicants array
    if (!job.applicants) job.applicants = [];
    if (job.applicants.includes(userId)) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    job.applicants.push(userId);
    await job.save();

    // Also save applied job in user's appliedJobs
    await User.findByIdAndUpdate(userId, { $addToSet: { appliedJobs: jobId } });

    res.json({ message: 'Applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply', error: error.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    await User.findByIdAndUpdate(userId, { $addToSet: { favorites: jobId } });

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Failed', error: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    await User.findByIdAndUpdate(userId, { $pull: { favorites: jobId } });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Failed', error: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json({ favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed', error: error.message });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Please provide mobile and otp' });
    }

    // Here you check OTP from your store or DB
    const storedOtp = otpStore[mobile];

    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid, remove it from store
    delete otpStore[mobile];

    // Find user and generate token
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, mobile: user.mobile } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};