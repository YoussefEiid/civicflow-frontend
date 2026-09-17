import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Middleware to enforce production maintenance mode across all API endpoints.
 * When MAINTENANCE_MODE is active, all application routes return HTTP 503
 * except health checks, status checks, and CORS preflight OPTIONS requests.
 */
export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // If maintenance mode is disabled, allow normal processing
  if (!env.MAINTENANCE_MODE) {
    return next();
  }

  // Always allow CORS preflight requests so clients do not experience CORS errors
  if (req.method === 'OPTIONS') {
    return next();
  }

  const path = (req.path || '').toLowerCase();
  const originalUrl = (req.originalUrl || req.url || '').toLowerCase();

  // Allow health check and maintenance status endpoints for Render / infrastructure monitoring
  const isAllowedEndpoint =
    path === '/health' ||
    path === '/api/health' ||
    path === '/maintenance/status' ||
    path === '/api/maintenance/status' ||
    path === '/system/status' ||
    path === '/api/system/status' ||
    originalUrl.startsWith('/api/health') ||
    originalUrl.startsWith('/api/maintenance/status') ||
    originalUrl.startsWith('/api/system/status');

  if (isAllowedEndpoint) {
    return next();
  }

  // Block normal application requests with HTTP 503 Service Unavailable
  return res.status(503).json({
    success: false,
    maintenance: true,
    error: {
      code: 'MAINTENANCE_MODE',
      message: 'الخدمة متوقفة مؤقتًا للصيانة'
    },
    message: 'الخدمة متوقفة مؤقتًا للصيانة'
  });
};
