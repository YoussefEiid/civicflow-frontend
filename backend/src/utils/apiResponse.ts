import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data })
  });
};

export const sendError = (
  res: Response,
  statusCode = 500,
  message = 'Internal Server Error',
  code = 'INTERNAL_ERROR',
  details?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(details && { details })
    }
  });
};
