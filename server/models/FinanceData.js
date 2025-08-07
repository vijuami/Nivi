const mongoose = require('mongoose');

const financeDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  income: {
    type: Number,
    default: 0,
  },
  incomeTransactions: [{
    id: String,
    amount: Number,
    description: String,
    source: String,
    date: Date,
  }],
  categories: [{
    id: String,
    name: String,
    percentage: Number,
    totalAllocated: Number,
    totalSpent: Number,
    totalBalance: Number,
    subcategories: [{
      id: String,
      name: String,
      allocatedAmount: Number,
      allocatedPercentage: Number,
      spentAmount: Number,
      balance: Number,
      expenses: [{
        id: String,
        amount: Number,
        description: String,
        date: Date,
        subcategoryId: String,
      }],
    }],
  }],
  emis: [{
    id: String,
    name: String,
    amount: Number,
    tenureLeft: Number,
    totalTenure: Number,
    paidCount: Number,
    isActive: Boolean,
  }],
  debts: [{
    id: String,
    name: String,
    pendingAmount: Number,
    monthlyPayment: Number,
    totalMonths: Number,
    paidAmount: Number,
    isActive: Boolean,
    reminderDate: Date,
  }],
  transactions: [{
    id: String,
    amount: Number,
    description: String,
    date: Date,
    subcategoryId: String,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('FinanceData', financeDataSchema);