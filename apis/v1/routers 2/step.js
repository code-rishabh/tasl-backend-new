
const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Step = require('../models/Step');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filenames
  },
});

const upload = multer({ storage });

router.post('/add-step/:guide_id', upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'welcome_audio', maxCount: 1 },
  ]), async (req, res) => {
    try {
      const { guide_id } = req.params; // Get guide_id from URL parameters
      const { name, description } = req.body; // Get other fields from request body
  
      // Check if files are uploaded
      const iconFile = req.files['icon'] ? req.files['icon'][0] : null;
      const welcomeAudioFile = req.files['welcome_audio'] ? req.files['welcome_audio'][0] : null;
  
      // Find the guide using guide_id
      const guide = await Guide.findOne({ guide_id });
      if (!guide) {
        return res.status(404).json({ status: false, message: 'Guide not found' });
      }
  
      // Create a new step
      const newStep = new Step({
        guide_id: guide.guide_id, // Store the ObjectId reference of the guide
        name,
        description,
        icon: iconFile ? iconFile.path : '',
        welcome_audio: welcomeAudioFile ? welcomeAudioFile.path : '',
      });
  
      // Save the step to the database
      const savedStep = await newStep.save();
  
      // Update the guide's steps array with the new step's ObjectId
      guide.steps.push(savedStep._id);
      await guide.save();
  
      // Return the response
      res.status(201).json({
        status: true,
        message: 'Step created successfully and added to guidee',
        step: {
          id: savedStep._id,
          guide_id: savedStep.guide_id,
          name: savedStep.name,
          description: savedStep.description,
          icon: savedStep.icon,
          welcome_audio: savedStep.welcome_audio,
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, message: 'Server error' });
    }
  });

router.get('/steps/:guide_id', async (req, res) => {
    try {
      const { guide_id } = req.params; // Get guide_id from URL parameters
  
      // Find the guide and populate the steps
      const guide = await Guide.findOne({ guide_id }).populate('steps');
  
      if (!guide) {
        return res.status(404).json({ status: false, message: 'Guide not found' });
      }
  
      // Format the steps data
      const steps = guide.steps.map((step) => ({
        id: step._id,
        guide_id: guide_id,
        name: step.name,
        description: step.description,
        icon: step.icon,
        welcome_audio: step.welcome_audio,
       
      }));
  
      // Return the response
      res.status(200).json({
        status: true,
        steps,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, message: 'Server error' });
    }
  });
  
  module.exports = router;