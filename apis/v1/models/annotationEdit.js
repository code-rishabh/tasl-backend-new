const mongoose = require('mongoose');

const annotationEditSchema = new mongoose.Schema({
  guide_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  step_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  annotation: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

const AnnotationEdit = mongoose.model('AnnotationEdit', annotationEditSchema);
module.exports = AnnotationEdit;