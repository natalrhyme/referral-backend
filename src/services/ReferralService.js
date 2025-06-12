const User = require('../models/User');
const Transaction = require('../models/Transaction');

class ReferralService {
  // Generate a unique referral code
  static async generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existingUser = await User.findOne({ referralCode: code });
      if (!existingUser) {
        isUnique = true;
      }
    }

    return code;
  }

  // Process a new purchase and distribute earnings
  static async processPurchase(userId, amount, description) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create purchase transaction
    const purchase = await Transaction.createPurchase(userId, amount, description);

    // If purchase amount is less than 1000, no earnings are distributed
    if (amount < 1000) {
      return purchase;
    }

    // Process Level 1 earnings (direct referral)
    if (user.referredBy) {
      const parentUser = await User.findById(user.referredBy);
      if (parentUser) {
        const level1Earning = parentUser.calculateEarnings(amount, 1);
        await parentUser.updateEarnings(amount, 1);
        
        await Transaction.createEarning(
          parentUser._id,
          level1Earning,
          1,
          user._id,
          `Level 1 earning from ${user.username}'s purchase`
        );
      }
    }

    // Process Level 2 earnings (indirect referral)
    if (user.referredBy) {
      const parentUser = await User.findById(user.referredBy);
      if (parentUser && parentUser.referredBy) {
        const grandParentUser = await User.findById(parentUser.referredBy);
        if (grandParentUser) {
          const level2Earning = grandParentUser.calculateEarnings(amount, 2);
          await grandParentUser.updateEarnings(amount, 2);
          
          await Transaction.createEarning(
            grandParentUser._id,
            level2Earning,
            2,
            user._id,
            `Level 2 earning from ${user.username}'s purchase`
          );
        }
      }
    }

    return purchase;
  }

  // Get user's referral tree
  static async getReferralTree(userId) {
    const user = await User.findById(userId)
      .populate('directReferrals', 'username email referralCode totalEarnings')
      .populate('referredBy', 'username email referralCode');

    if (!user) {
      throw new Error('User not found');
    }

    const referralTree = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        totalEarnings: user.totalEarnings,
        level1Earnings: user.level1Earnings,
        level2Earnings: user.level2Earnings
      },
      referredBy: user.referredBy ? {
        id: user.referredBy._id,
        username: user.referredBy.username,
        email: user.referredBy.email,
        referralCode: user.referredBy.referralCode
      } : null,
      directReferrals: user.directReferrals.map(referral => ({
        id: referral._id,
        username: referral.username,
        email: referral.email,
        referralCode: referral.referralCode,
        totalEarnings: referral.totalEarnings
      }))
    };

    return referralTree;
  }

  // Get user's earnings report
  static async getEarningsReport(userId) {
    const transactions = await Transaction.find({
      user: userId,
      type: 'EARNING'
    })
    .sort({ createdAt: -1 })
    .populate('referredBy', 'username email');

    const report = {
      totalEarnings: 0,
      level1Earnings: 0,
      level2Earnings: 0,
      transactions: []
    };

    transactions.forEach(transaction => {
      if (transaction.referralLevel === 1) {
        report.level1Earnings += transaction.amount;
      } else {
        report.level2Earnings += transaction.amount;
      }
      report.totalEarnings += transaction.amount;

      report.transactions.push({
        id: transaction._id,
        amount: transaction.amount,
        level: transaction.referralLevel,
        referredBy: transaction.referredBy ? {
          username: transaction.referredBy.username,
          email: transaction.referredBy.email
        } : null,
        description: transaction.description,
        createdAt: transaction.createdAt
      });
    });

    return report;
  }
}

module.exports = ReferralService; 