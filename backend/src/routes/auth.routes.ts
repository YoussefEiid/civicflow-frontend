import { Router } from 'express';
import {
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordResetOTP,
  verifyResetOTP,
  resetPasswordWithOTP
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter, refreshLimiter } from '../middlewares/rateLimit.middleware.js';

export const authRouter = Router();

authRouter.post('/login', authLimiter, login);
authRouter.post('/refresh', refreshLimiter, refreshToken);
authRouter.post('/logout', logout);
authRouter.post('/forgot-password-otp', authLimiter, requestPasswordResetOTP);
authRouter.post('/verify-reset-otp', authLimiter, verifyResetOTP);
authRouter.post('/reset-password-otp', authLimiter, resetPasswordWithOTP);

// Protected routes
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/profile', authenticate, updateProfile);
authRouter.post('/change-password', authenticate, changePassword);