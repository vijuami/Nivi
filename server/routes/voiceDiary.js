const express = require('express');
const VoiceDiary = require('../models/VoiceDiary');
const auth = require('../middleware/auth');

const router = express.Router();

// Get voice diary entries
router.get('/', auth, async (req, res) => {
  try {
    let voiceDiary = await VoiceDiary.findOne({ userId: req.user._id });
    
    if (!voiceDiary) {
      voiceDiary = new VoiceDiary({
        userId: req.user._id,
        entries: [],
      });
      await voiceDiary.save();
    }

    res.json(voiceDiary.entries);
  } catch (error) {
    console.error('Get voice diary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update voice diary entries
router.put('/', auth, async (req, res) => {
  try {
    const voiceDiary = await VoiceDiary.findOneAndUpdate(
      { userId: req.user._id },
      { entries: req.body.entries, userId: req.user._id },
      { new: true, upsert: true }
    );

    res.json(voiceDiary.entries);
  } catch (error) {
    console.error('Update voice diary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;