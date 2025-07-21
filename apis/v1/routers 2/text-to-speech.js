const express = require('express');
const mongoose = require('mongoose');
const MyModel = require('../models/audio'); 


const router = express.Router();

// List of available audio file links
const audioLinks = [
  'https://res.cloudinary.com/dgdaiyqiv/video/upload/v1740141005/fjeoowp6ufyzdty72uip.mp3',
  'https://res.cloudinary.com/dgdaiyqiv/video/upload/v1740141002/gtiysqzvugv6vfzgppl1.mp3',
  'https://res.cloudinary.com/dgdaiyqiv/video/upload/v1740141001/xn7y4dnidxgnljsfrctb.mp3'
];

router.post('/text-to-speech', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text field is required' });
  }

  try {
    // Select a random audio link
    const randomLink = audioLinks[Math.floor(Math.random() * audioLinks.length)];

    // Store in MongoDB
    const newEntry = new MyModel({ text, link: randomLink });
    await newEntry.save();

    res.status(200).json({ message: 'Text-to-speech entry created', link: randomLink ,text:text});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;