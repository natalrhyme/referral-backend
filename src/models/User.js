const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  directReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalEarnings: {
    type: Number,
    default: 0
  },
  level1Earnings: {
    type: Number,
    default: 0
  },
  level2Earnings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if user can add more direct referrals
userSchema.methods.canAddReferral = function() {
  return this.directReferrals.length < 8;
};

// Method to add a direct referral
userSchema.methods.addDirectReferral = async function(referralId) {
  if (!this.canAddReferral()) {
    throw new Error('Maximum direct referrals limit reached');
  }
  
  if (this.directReferrals.includes(referralId)) {
    throw new Error('User is already a direct referral');
  }
  
  this.directReferrals.push(referralId);
  await this.save();
};

// Method to calculate earnings
userSchema.methods.calculateEarnings = function(amount, level) {
  if (amount < 1000) return 0;
  
  const percentage = level === 1 ? 0.05 : 0.01;
  return amount * percentage;
};

// Method to update earnings
userSchema.methods.updateEarnings = async function(amount, level) {
  const earnings = this.calculateEarnings(amount, level);
  
  if (level === 1) {
    this.level1Earnings += earnings;
  } else {
    this.level2Earnings += earnings;
  }
  
  this.totalEarnings += earnings;
  await this.save();
  
  return earnings;
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 