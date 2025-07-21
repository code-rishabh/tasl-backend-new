const mongoose = require('mongoose');

const mySchema = new mongoose.Schema({
  text: { type: String, required: true },
  link: { type: String, default: '' } // Optional link field
});

const MyModel = mongoose.model('audio', mySchema);

module.exports = MyModel;