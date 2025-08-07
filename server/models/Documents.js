const mongoose = require('mongoose');

const documentsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documents: [{
    id: String,
    name: String,
    category: String,
    type: String,
    size: String,
    uploadDate: String,
    tags: [String],
    fileUrl: String,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Documents', documentsSchema);