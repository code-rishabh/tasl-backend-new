const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide'); // Import the Guide model
const Step = require('../models/Step')
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filenames
  },
});

const upload = multer({ storage });

// Get All guides ka partial data id name,numver if steps , description.
router.get('/get-all-guides', async (req, res) => {
  try {
    const guides = await Guide.find({}, '_id name description steps created_at updated_at');

    // Transform the response to include step count
    const formattedGuides = guides.map(guide => ({
      _id: guide._id,
      name: guide.name,
      description: guide.description,
      steps_count: guide.steps.length, // Number of steps
      created_at: guide.created_at,
      updated_at: guide.updated_at
    }));

    res.status(200).json({ guides: formattedGuides });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// all info of guide by guide_id all details 
// Get Guide by ID
router.get('/guide-info', async (req, res) => {
  try {
    const { id } = req.query; // Get the guide ID from query parameters

    if (!id) {
      return res.status(400).json({ status: false, message: 'Guide ID is required' });
    }

    // Fetch guide from MongoDB
    const guide = await Guide.findById(id);

    if (!guide) {
      return res.status(404).json({ status: false, message: 'Guide not found' });
    }

    res.status(200).json({
      status: true,
      guide,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});


// Add Guide Route
router.post('/add-guide', async (req, res) => {
  try {
    const { name, description, steps } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Create a new guide document
    const newGuide = new Guide({
      name,
      description,
      steps,
    });

    // Save the guide to MongoDB
    await newGuide.save();

    res.status(201).json({ message: 'Guide added successfully', guide: newGuide });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit Guide by ID (POST)
router.get('/edit-guide/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract _id from the URL parameter

    // Find the guide by _id
    const guide = await Guide.findById(id);

    // If guide not found, return 404
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Return the guide document
    res.status(200).json({ message: 'Guide fetched successfully', guide });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/edit-guide/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract _id from the URL parameter
    const { guide_id, name, description, steps } = req.body; // Extract updated data from the request body

  

    // Find the guide by _id and update it
    const updatedGuide = await Guide.findByIdAndUpdate(
      id,
      {
        name,
        description,
        steps,
      },
      { new: true } // Return the updated document
    );

    // If guide not found, return 404
    if (!updatedGuide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Return the updated guide document
    res.status(200).json({ message: 'Guide updated successfully', guide: updatedGuide });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate guide_id. guide_id must be unique.' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});
// Endpoint to delete a guide by guide_id
router.post('/delete-guide/:guide_id', async (req, res) => {
  try {
    const { guide_id } = req.params; // Get guide_id from URL parameters

    // Find the guide by guide_id and delete it
    const deletedGuide = await Guide.findOneAndDelete({ _id: guide_id });

    if (!deletedGuide) {
      return res.status(404).json({ status: false, message: 'Guide not found' });
    }

    // Return success response
    res.status(200).json({
      status: true,
      message: 'Guide deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

module.exports = router;