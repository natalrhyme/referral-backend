require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB Configuration
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/referral-system',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpiration: '24h',

  // Frontend URL (for CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Referral System Configuration
  referralConfig: {
    maxDirectReferrals: 8,
    minPurchaseAmount: 1000,
    level1Percentage: 0.05, // 5%
    level2Percentage: 0.01  // 1%
  }
}; 