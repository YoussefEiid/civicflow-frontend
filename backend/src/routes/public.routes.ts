import { Router } from 'express';
import {
  trackPublicRequest,
  submitPublicRequest,
  getPublicFormData,
  downloadPublicAttachment
} from '../controllers/public.controller.js';
import { publicLimiter } from '../middlewares/rateLimit.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

export const publicRouter = Router();

// Public metadata for submission form
publicRouter.get('/form-data', getPublicFormData);

// Public Request Submission with identity and request document uploads
publicRouter.post(
  '/submit-request',
  publicLimiter,
  upload.fields([
    { name: 'identityFiles', maxCount: 10 },
    { name: 'identityDocument', maxCount: 10 },
    { name: 'identityFile', maxCount: 10 },
    { name: 'requestFiles', maxCount: 10 },
    { name: 'requestDocument', maxCount: 10 },
    { name: 'requestFile', maxCount: 10 },
    { name: 'files', maxCount: 20 }
  ]),
  submitPublicRequest
);
publicRouter.post(
  '/requests',
  publicLimiter,
  upload.fields([
    { name: 'identityFiles', maxCount: 10 },
    { name: 'identityDocument', maxCount: 10 },
    { name: 'identityFile', maxCount: 10 },
    { name: 'requestFiles', maxCount: 10 },
    { name: 'requestDocument', maxCount: 10 },
    { name: 'requestFile', maxCount: 10 },
    { name: 'files', maxCount: 20 }
  ]),
  submitPublicRequest
);

// Public Citizen Tracking
publicRouter.get('/track/:tokenOrNumber', publicLimiter, trackPublicRequest);

// Download Publicly Permitted Stage Documents ONLY
publicRouter.get('/attachments/:id/download', publicLimiter, downloadPublicAttachment);