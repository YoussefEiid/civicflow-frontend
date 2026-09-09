import rateLimit from 'express-rate-limit';

// Strict limiter for login attempts (10 requests per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.'
    }
  }
});

// Refresh token limiter (30 requests per 15 minutes)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'تم تجاوز الحد الأقصى لمحاولات تحديث الجلسة. يرجى المحاولة لاحقاً.'
    }
  }
});

// Public request tracking limiter (60 requests per 15 minutes)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'تم تجاوز الحد الأقصى لطلبات الاستعلام العامة. يرجى المحاولة بعد قليل.'
    }
  }
});

// General API limiter (300 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'تم تجاوز معدل الطلبات المسموح به. يرجى المحاولة لاحقاً.'
    }
  }
});
