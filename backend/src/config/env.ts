import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env files
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config(); // Fallback for root-level env if running from build/dist

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-jwt-development-mode',
};

// Validate required env variables
const requiredEnvs: Array<keyof typeof ENV> = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GEMINI_API_KEY',
  'DATABASE_URL',
];

for (const key of requiredEnvs) {
  if (!ENV[key]) {
    console.warn(`WARNING: Missing critical environment variable: ${key}`);
  }
}
