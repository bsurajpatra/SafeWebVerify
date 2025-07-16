const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  features: {
    type: [Number],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema); 