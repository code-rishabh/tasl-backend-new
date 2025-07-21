const mongoose = require('mongoose');

const guideEditSchema = new mongoose.Schema({
  guide_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_fields: { type: Object, required: true }, // Stores only the changed fields
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('GuideEdit', guideEditSchema);