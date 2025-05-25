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
const nodemailer = require('nodemailer');
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
const logoUrl = "https://hirealis-web.vercel.app/assets/logo-BEQSbQOd.png";



exports.support =  async (req, res) => {
  const { name, email, message } = req.body;

  

  const supportMail = {
    from: email,
    to: 
    'thedevrohit@gmail.com',
    subject: `Support Query from ${name}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 24px;">
        <img src=${logoUrl} alt="App Logo" style="height: 48px; margin-bottom: 16px;" />
        <h2 style="color: #333;">📩 New Support Message Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #eee;">
          ${message}
        </div>
        <p style="margin-top: 24px; color: #666;">Please respond to the user via email at your earliest convenience.</p>
      </div>

    `
  };

  const userMail = {
    from: 'thedevrohit@gmail.com',
    to: email,
    subject: 'Thank you for reaching out!',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; padding: 24px;">
        <div style="text-align: center;">
          <img src=${logoUrl} alt="Hirealis" style="height: 56px; margin-bottom: 16px;" />
          <h2 style="color: #333;">Thank You for Reaching Out! 🙌</h2>
        </div>
        
        <p>Hi <strong>${name}</strong>,</p>

        <p>We’ve received your message and our team will get back to you as soon as possible. Here’s a quick summary of your query:</p>

        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 16px;">
          <p style="margin: 0;"><strong>Your Message:</strong></p>
          <p style="margin: 0;">${message}</p>
        </div>

        <p>We appreciate your patience and are here to help you in every possible way.</p>

        <p style="margin-top: 24px;">Warm regards,<br/>
        <strong>Team YourAppName</strong><br/>
        <a href="https://hirealis-web.vercel.app/" style="color: #4a90e2;">Visit Website</a> | <a href="mailto:support@yourapp.com" style="color: #4a90e2;">support@yourapp.com</a></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(supportMail);
    await transporter.sendMail(userMail);
    res.status(200).send({ success: true, message: 'Support email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: 'Failed to send email' });
  }
};


exports.signup = async (req, res) => {
  try {
    const { name, mobile, password, userType , skill , email } = req.body;
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

   const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
      let field = existingUser.email === email ? 'Email' : 'Mobile number';
      return res.status(400).json({ message: `${field} already registered` });
    }

    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = new User({
      name,
      mobile,
      email,
      skills : skill,
      image : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      password: hashedPassword,
      userType: userType || 'user', // default user
    });

    await user.save();
    const welcomeNotification = new Notification({
      title: `Hii ${user.name} Welcome to Hirealis!`, // Replace with your app name
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
    const { email, mobile, password, otp } = req.body;

    if ((!email && !mobile) || (!password && !otp)) {
      return res.status(400).json({ message: 'Provide email/mobile and password or OTP' });
    }

    const query = email ? { email } : { mobile };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }
    // Verify OTP
    else if (otp) {
      const identifier = mobile || user.mobile; // use mobile from req or user record
      const record = otpStore[identifier];
      if (!record) return res.status(400).json({ message: 'No OTP sent' });
      if (Date.now() > record.expires) {
        delete otpStore[identifier];
        return res.status(400).json({ message: 'OTP expired' });
      }
      if (record.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      delete otpStore[identifier];
    }

    const token = generateToken(user);
    const { password: pwd, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      message: 'Logged in successfully',
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



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "thedevrohit@gmail.com",
        pass: "fyitnuzbzoytnutb"
    }
});




exports.sendMailToHR = async (req, res) => {
  try {
    const { hrEmail, subject, description, from, resumeUrl } = req.body;

    if (!hrEmail || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (hrEmail, subject, description)"
      });
    }

    const fromEmail = from;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thedevrohit@gmail.com",
        pass: "fyitnuzbzoytnutb"
      },
    });


    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <p><strong>From:</strong> ${fromEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${description}</p>

        ${resumeUrl ? `
        <p><strong>Resume:</strong> <a href="${resumeUrl}" target="_blank" style="color: #1a73e8;">View Resume</a></p>
        ` : ''}

        <hr style="margin: 30px 0;" />
        <p style="text-align: center; font-size: 14px; color: #555;">
          Applied via <strong>Hirealis</strong> job platform
        </p>
        <div style="text-align: center; margin-top: 10px;">
          <img src="${logoUrl}" alt="Hirealis Logo" width="100" style="border-radius: 8px;" />
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Hirealis Applicant" <${fromEmail}>`,
      to: from,
      subject,
      html: htmlContent,
    });
    
    // Email to Applicant (User)
    const htmlContentUser = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>🎉 Congratulations!</h2>
        <p>Dear candidate,</p>
        <p>You have <strong>successfully applied</strong> for the job position via <strong>Hirealis</strong>.</p>
        <p>Your application has been sent to the respective HR. We wish you the best of luck in your job journey!</p>

        <p>If you have attached your resume, it has been shared as part of the application.</p>

        <p style="margin-top: 20px;">Stay connected with Hirealis for more job opportunities tailored just for you.</p>

        <div style="text-align: center; margin: 30px 0;">
          <img src="${logoUrl}" alt="Hirealis Logo" width="120" style="border-radius: 8px;" />
        </div>

        <hr />
        <p style="font-size: 13px; color: #777; text-align: center;">
          This email was sent to confirm your job application on Hirealis.
        </p>
      </div>
    `;

    // Send confirmation to user
    await transporter.sendMail({
      from: `"Hirealis Team" <thedevrohit@gmail.com>`,
      to: from,
      subject: "✅ Application Received – Hirealis",
      html: htmlContentUser,
    });


    return res.status(200).json({ success: true, message: "Mail sent to HR successfully" });
  } catch (error) {
    console.error("Error in sendMailToHR:", error);
    return res.status(500).json({ success: false, message: "Failed to send email to HR", error: error.message });
  }
};

const sendEmailOTPHelper = async (to, otp) => {
  try {
    console.log("email = ", to);
    console.log("otp = ", otp);

    await transporter.sendMail({
      from: '"Hirealis Support" <thedevrohit@gmail.com>',
      to: to,
      subject: 'Your OTP Code - Hirealis',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #673ab7; padding: 20px; text-align: center;">
            <img src="https://hirealis-web.vercel.app/assets/logo-BEQSbQOd.png" alt="Hirealis Logo" style="height: 50px;" />
            <h2 style="color: #fff; margin-top: 10px;">OTP Verification</h2>
          </div>
          <div style="padding: 30px; text-align: center;">
            <p style="font-size: 16px; color: #333;">
              Hello,
              <br /><br />
              You recently requested to verify your email address with <strong>Hirealis</strong>.
              Please use the following OTP to proceed:
            </p>
            <h1 style="font-size: 32px; color: #673ab7; margin: 20px 0;">${otp}</h1>
            <p style="font-size: 14px; color: #555;">
              This OTP is valid for the next <strong>5 minutes</strong>.
              <br />
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              Need help? Contact us at <a href="mailto:support@hirealis.com">support@hirealis.com</a><br />
              &copy; ${new Date().getFullYear()} Hirealis. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      `
    });

    return true;
  } catch (e) {
    console.log("error = ", e);
  }
};


exports.sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await sendEmailOTPHelper(email, otp);

    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
   
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const record = otpStore[email];
    if (!record) {
      return res.status(400).json({ message: 'No OTP sent or expired' });
    }

    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid
    delete otpStore[email]; // Clear OTP after successful verification

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating password', error: error.message });
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

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; 
    console.log("usr = ",userId);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
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