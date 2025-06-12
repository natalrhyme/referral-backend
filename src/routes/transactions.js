const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ReferralService = require('../services/ReferralService');
const Transaction = require('../models/Transaction');

// Middleware to verify JWT token (reuse from users.js)
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Create a new purchase
router.post('/purchase', auth, [
  body('amount').isFloat({ min: 0 }),
  body('description').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;

    // Process purchase and distribute earnings
    const purchase = await ReferralService.processPurchase(
      req.user._id,
      amount,
      description
    );

    res.status(201).json({
      message: 'Purchase processed successfully',
      purchase
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing purchase', error: error.message });
  }
});

// Get user's transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('referredBy', 'username email');

    res.json({
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        referralLevel: transaction.referralLevel,
        referredBy: transaction.referredBy ? {
          username: transaction.referredBy.username,
          email: transaction.referredBy.email
        } : null,
        description: transaction.description,
        createdAt: transaction.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction history', error: error.message });
  }
});

// Get transaction details
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('referredBy', 'username email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      referralLevel: transaction.referralLevel,
      referredBy: transaction.referredBy ? {
        username: transaction.referredBy.username,
        email: transaction.referredBy.email
      } : null,
      description: transaction.description,
      createdAt: transaction.createdAt,
      metadata: transaction.metadata
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction details', error: error.message });
  }
});

module.exports = router; 