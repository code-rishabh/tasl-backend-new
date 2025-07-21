const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  guide_id: {
    type: Number, // Change this from ObjectId to Number
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  welcome_audio: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  contents: [
    {
      type: {
        type: String,
      },
      link: {
        type: String,
      },
      placement: {
        type: String,
      },
    },
  ],
});

// Prevent OverwriteModelError
delete mongoose.connection.models['Step'];

const Step =  mongoose.model('Step', StepSchema);

module.exports = Step;