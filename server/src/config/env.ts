import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sellpilot',
  jwt: {
    secret: process.env.JWT_SECRET || 'sellpilot_default_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    isTestMode: (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_'),
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
  },
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

if (config.isProduction) {
  const missing = [
    ['MONGO_URI', process.env.MONGO_URI],
    ['JWT_SECRET', process.env.JWT_SECRET],
    ['CLIENT_URL', process.env.CLIENT_URL],
    ['RAZORPAY_KEY_ID', process.env.RAZORPAY_KEY_ID],
    ['RAZORPAY_KEY_SECRET', process.env.RAZORPAY_KEY_SECRET],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.map(([name]) => name).join(', ')}`);
  }
  if (config.jwt.secret === 'sellpilot_default_jwt_secret_change_me') {
    throw new Error('JWT_SECRET must be changed in production');
  }
  if (!config.razorpay.isTestMode) {
    throw new Error('Only Razorpay Test Mode credentials are supported');
  }
}
