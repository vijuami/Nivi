const mongoose = require('mongoose');

const voiceDiarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  entries: [{
    id: String,
    title: String,
    content: String,
    date: Date,
    duration: Number,
    mood: String,
    tags: [String],
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('VoiceDiary', voiceDiarySchema);