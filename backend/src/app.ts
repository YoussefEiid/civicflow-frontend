import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { sendSuccess } from './utils/apiResponse.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// Security headers
app.use(helmet());

// CORS configuration for Frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000'
      ];
      if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads serving is restricted to non-production environments
// In production, all document downloads must go through authenticated/authorized API endpoints
if (env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, { timestamp: new Date().toISOString() }, 'API is running');
});

// Mount API Router
app.use('/api', apiRouter);

// Centralized error handling
app.use(errorHandler);