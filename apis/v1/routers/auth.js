const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');



async function sendOTPByEmail(email, otp,userName) {
  //omfi djkw vzxn xrde
  // Configure Nodemailer with your email service provider's details
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Change to your email service provider
    auth: {
      user: 'Abhishekkange00@gmail.com', // Change to your email address
      pass:'omfi djkw vzxn xrde', // Change to your email password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Email content
  const mailOptions = {
    from: 'Abhishekkange00@gmail.com', // Change to your email address
    to: email,
    subject: 'NearbyKart Verification OTP',
    html: `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <title>MAIL</title>
    </head>
    
    <style>
    
        .nearby{
    
            font-family: "Poppins", sans-serif;
      font-weight: 300;
      font-style: normal;
        }
    
        .kart{
    
            font-family: "Poppins", sans-serif;
      font-weight: 500;
      font-style: italic;
    
        }
    </style>
    
    <body class="bg-gray-100">
    
        <div class="container mx-auto py-8">
    
            <div class="flex justify-center items-center mb-8">
                <h1 class=" nearby">NearbyKart</h1>
            </div>
    
            <div class="bg-white p-8 rounded-lg shadow-lg">
                <p class="text-lg text-gray-700 font-poppins">Thank you <strong> ${userName}</strong> for choosing Nearbykart!</p>
    
                <p class="mt-4 text-gray-600 font-poppins">To complete your account registration and ensure the security of your account, please use the following one-time password (OTP) to verify your email address:</p>
    
                <h1 class="text-4xl font-bold text-center text-blue-500 mt-6 font-poppins">${otp}</h1>
    
                <p class="mt-6 text-gray-600 font-poppins">If you did not request this OTP, please disregard this message.</p>
    
                <p class="mt-6 text-gray-600 font-poppins">Thank you,<br>The Nearbykart Team</p>
            </div>
    
        </div>
    
    </body>
    
    </html>
    `,
  };

  // Send email
  console.log("mail sent to " + email);
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", result);
    return result;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
}
//request reset-password
router.post('/request-reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();


    // Store OTP and expiry (valid for 10 mins)
    user.otp = otp;
    await user.save();

    // Send OTP via email
    await sendOTPByEmail(email, otp, user.username);

    res.json({ message: 'OTP sent to email' });

  } catch (error) {
    console.error('Error in /request-reset-password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and has not expired
    if (!user.otp) {
      return res.status(400).json({ message: 'OTP invalid' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and remove OTP fields
    user.password = hashedPassword;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Error in /reset-password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});









// Signup Endpoint
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Check if username or email already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        const errors = {};
  
        if (existingUser.username === username) {
          errors.username = ["The username has already taken."];
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

// router.post('/reset-password', async (req, res) => {
//   try {
//     const { adminToken, adminPassword, userToken, newPassword } = req.body;

//     if (!adminToken || !adminPassword || !userToken || !newPassword) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Verify Admin Token
//     const adminDecoded = verifyToken(adminToken);
//     if (!adminDecoded) {
//       return res.status(401).json({ message: 'Invalid or expired admin token' });
//     }

//     // Find Admin User
//     const adminUser = await User.findById(adminDecoded._id);
//     if (!adminUser || adminUser.role !== 0) {
//       return res.status(403).json({ message: 'Unauthorized: Not an admin' });
//     }

//     // Compare Admin Password
//     const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Incorrect admin password' });
//     }

//     // Verify Normal User Token
//     const userDecoded = verifyToken(userToken);
//     if (!userDecoded) {
//       return res.status(401).json({ message: 'Invalid or expired user token' });
//     }

//     // Find Normal User
//     const normalUser = await User.findById(userDecoded._id);
//     if (!normalUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Hash New Password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     normalUser.password = hashedPassword;
//     await normalUser.save();

//     res.json({ message: 'Password reset successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

module.exports = router;