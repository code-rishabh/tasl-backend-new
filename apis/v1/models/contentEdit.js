const mongoose = require('mongoose');

const contentEditSchema = new mongoose.Schema({
  guide_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  step_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  content_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  old_placement: [{ type: String }], // Store previous placement
  new_placement: [{ type: String }], // Store requested placement
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

const ContentEdit = mongoose.model('ContentEdit', contentEditSchema);
module.exports = ContentEdit;