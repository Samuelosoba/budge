const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'investment', 'loan'],
    required: [true, 'Account type is required']
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: [3, 'Currency code cannot exceed 3 characters']
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  bankName: {
    type: String,
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters']
  },
  accountNumber: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  routingNumber: {
    type: String,
    select: false
  },
  plaidAccountId: {
    type: String,
    select: false
  },
  lastSynced: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
bankAccountSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);