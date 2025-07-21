const express = require('express');
const mongoose = require('mongoose');
const MyModel = require('../models/audio'); 
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

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

    const FILE_PATH = "uploads"
    console.log("API called")
    const BASE_URL = process.env.BASE_URL
    const response = await axios.post('http://localhost:8000/generate-audio',{text:text});
    console.log(response)
    // const file_pathh = `${BASE_URL}/${FILE_PATH}/${response.data.file_path}`;
    const file_pathh = `${response.data.file_path}`;

    res.json({file_path:file_pathh});
    console.log("out:", file_pathh);

});

module.exports = router;
