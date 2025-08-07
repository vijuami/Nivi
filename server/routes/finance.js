const express = require('express');
const FinanceData = require('../models/FinanceData');
const auth = require('../middleware/auth');

const router = express.Router();

// Get finance data
router.get('/', auth, async (req, res) => {
  try {
    let financeData = await FinanceData.findOne({ userId: req.user._id });
    
    if (!financeData) {
      // Create default finance data
      financeData = new FinanceData({
        userId: req.user._id,
        income: 0,
        incomeTransactions: [],
        categories: [],
        emis: [],
        debts: [],
        transactions: [],
      });
      await financeData.save();
    }

    res.json(financeData);
  } catch (error) {
    console.error('Get finance data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update finance data
router.put('/', auth, async (req, res) => {
  try {
    const financeData = await FinanceData.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { new: true, upsert: true }
    );

    res.json(financeData);
  } catch (error) {
    console.error('Update finance data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;