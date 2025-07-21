const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Signup Endpoint
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Check if username or email already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        const errors = {};
  
        if (existingUser.username === username) {
          errors.username = ["The username has already been taken."];
        }
        if (existingUser.email === email) {
          errors.email = ["The email has already been taken."];
        }
  
        return res.status(400).json({
          status: false,
          message: "The username or email has already been taken.",
          errors,
        });
      }
  
      // Create new user
      const user = new User({ username, email, password, role: 2 }); // Default role is trainee
      await user.save();
  
      // Generate JWT token
      const token = user.generateAuthToken();
  
      // Success response
      res.status(201).json({
        status: true,
        message: "Signup successful!",
        token,
        role: user.role,
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error'+err.toString() });
    }
  });



// Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "The selected username is invalid.",
          errors: {
            username: ["The selected username is invalid."]
          }
        });
      }
  
      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          status: false,
          message: "Incorrect Username / Password"
        });
      }
  
      // Generate JWT token
      const token = user.generateAuthToken();
  
      res.status(200).json({
        status: true,
        message: "Login successful",
        token,
        role: user.role
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Server error"
      });
    }
  });

// Forgot Password Endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 600000; // OTP expires in 10 minutes
    await user.save();

    // Send OTP to email (using nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to send OTP' });
      }
      res.status(200).json({ message: 'OTP sent to email' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password Endpoint


// Middleware to verify JWT and extract user ID
const verifyToken = (token) => {
  try {
    return jwt.verify(token, 'abhishek'); // Replace with your secret key
  } catch (err) {
    return null;
  }
};

router.post('/reset-password', async (req, res) => {
  try {
    const { adminToken, adminPassword, userToken, newPassword } = req.body;

    if (!adminToken || !adminPassword || !userToken || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify Admin Token
    const adminDecoded = verifyToken(adminToken);
    if (!adminDecoded) {
      return res.status(401).json({ message: 'Invalid or expired admin token' });
    }

    // Find Admin User
    const adminUser = await User.findById(adminDecoded._id);
    if (!adminUser || adminUser.role !== 0) {
      return res.status(403).json({ message: 'Unauthorized: Not an admin' });
    }

    // Compare Admin Password
    const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect admin password' });
    }

    // Verify Normal User Token
    const userDecoded = verifyToken(userToken);
    if (!userDecoded) {
      return res.status(401).json({ message: 'Invalid or expired user token' });
    }

    // Find Normal User
    const normalUser = await User.findById(userDecoded._id);
    if (!normalUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    normalUser.password = hashedPassword;
    await normalUser.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;