const express = require('express');
const mongoose = require('mongoose');

// Content Schema
const contentSchema = new mongoose.Schema({
  type: String,
  link: String,
  filename: String,
  images: [{ type: String }],
  placement: [{ type: String }], // Change placement to an array of strings
});

// Step Schema
const stepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  welcome_audio: { type: String, required: true },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  contents: [contentSchema], // Embed content schema
  annotations:  {type: String},
});

// Guide Schema
const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  steps: [stepSchema], // Embed step schema
});

// Guide Model
const Guide = mongoose.model('Guide', guideSchema);
module.exports = Guide;