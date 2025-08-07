const express = require('express');
const Documents = require('../models/Documents');
const auth = require('../middleware/auth');

const router = express.Router();

// Get documents
router.get('/', auth, async (req, res) => {
  try {
    let documents = await Documents.findOne({ userId: req.user._id });
    
    if (!documents) {
      documents = new Documents({
        userId: req.user._id,
        documents: [],
      });
      await documents.save();
    }

    res.json(documents.documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update documents
router.put('/', auth, async (req, res) => {
  try {
    const documents = await Documents.findOneAndUpdate(
      { userId: req.user._id },
      { documents: req.body.documents, userId: req.user._id },
      { new: true, upsert: true }
    );

    res.json(documents.documents);
  } catch (error) {
    console.error('Update documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;