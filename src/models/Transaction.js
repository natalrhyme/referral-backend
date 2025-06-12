const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['PURCHASE', 'EARNING'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  referralLevel: {
    type: Number,
    enum: [1, 2],
    required: function() {
      return this.type === 'EARNING';
    }
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type === 'EARNING';
    }
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ referredBy: 1, createdAt: -1 });

// Method to check if transaction is eligible for earnings
transactionSchema.methods.isEligibleForEarnings = function() {
  return this.amount >= 1000;
};

// Static method to create a purchase transaction
transactionSchema.statics.createPurchase = async function(userId, amount, description, metadata = {}) {
  return this.create({
    user: userId,
    amount,
    type: 'PURCHASE',
    description,
    metadata
  });
};

// Static method to create an earning transaction
transactionSchema.statics.createEarning = async function(userId, amount, referralLevel, referredBy, description) {
  return this.create({
    user: userId,
    amount,
    type: 'EARNING',
    referralLevel,
    referredBy,
    description
  });
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 