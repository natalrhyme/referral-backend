const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Store active socket connections
const activeConnections = new Map();

// Initialize Socket.IO middleware
const initializeSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    // Store socket connection
    activeConnections.set(userId, socket);

    console.log(`User connected: ${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      activeConnections.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

// Emit earnings update to user
const emitEarningsUpdate = (userId, data) => {
  const socket = activeConnections.get(userId.toString());
  if (socket) {
    socket.emit('earningsUpdate', data);
  }
};

// Emit referral update to user
const emitReferralUpdate = (userId, data) => {
  const socket = activeConnections.get(userId.toString());
  if (socket) {
    socket.emit('referralUpdate', data);
  }
};

// Emit transaction update to user
const emitTransactionUpdate = (userId, data) => {
  const socket = activeConnections.get(userId.toString());
  if (socket) {
    socket.emit('transactionUpdate', data);
  }
};

module.exports = {
  initializeSocket,
  emitEarningsUpdate,
  emitReferralUpdate,
  emitTransactionUpdate
}; 