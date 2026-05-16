require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 4000,
  isProduction: process.env.NODE_ENV === 'production',

  db: {
    url: process.env.DATABASE_URL,
    poolMax: 20,
    idleTimeout: 30000,
    connectionTimeout: 2000,
    ssl: process.env.NODE_ENV === 'production'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
    vertexLocation: process.env.VERTEX_AI_LOCATION || 'us-central1',
    temperature: 0.3,
    maxTokens: 2048
  },

  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 500
  },

  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  }
};

// Validate critical config
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0 && config.isProduction) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = config;
