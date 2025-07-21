const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get All Users
router.get('/users', async (req, res) => {
    try {
      const users = await User.find({}, { username: 1, email: 1, role: 1 });
  
      const formattedUsers = users.map((user) => ({
        id: user._id, // Assuming _id is used as the unique identifier
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        role: user.role, // Keeping role as number
      }));
  
      res.status(200).json({
        status: true,
        users: formattedUsers,
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
// Update User Role
router.post('/edit-user/:id', async (req, res) => {
    const { username, new_role } = req.body;
    const id = req.params.id;
  
    try {
      
      // Find user by username
      const user = await User.findOne({ _id: id });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      } else{
 // Update user role
 user.role = new_role;
 await user.save();

 res.status(200).json({
   status: true,
   message: "User updated successfully",
   user: {
     id: user._id,
     username: user.username,
     email: user.email,
     role: user.role,
     
   }
 });
        
      }
  
     
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

router.post('/delete-user/:id', async (req, res) => {
    const { username } = req.body;
    const id = req.params.id;
  
    try {
      const user = await User.findOneAndDelete({ _id: id });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        });
      }
  
      res.status(200).json({
        status: true,
        message: "User deleted successfully"
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });


  //Add a new user

  router.post('/add-user', async (req, res) => {
    try {
      const { email, username, password, role } = req.body;
  
      // Validate required fields
      if (!email || !username || !password) {
        return res.status(400).json({ status: false, message: 'Email, username, and password are required' });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ status: false, message: 'Username or Email already exists' });
      }
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new User({
        email,
        username,
        password: hashedPassword,
        role: role || 2, // Default role is 2 (trainee)
      });
  
      await newUser.save();
  
      res.status(201).json({
        status: true,
        message: 'User created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  });
  


module.exports = router;