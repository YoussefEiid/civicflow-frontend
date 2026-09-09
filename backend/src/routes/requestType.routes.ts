import { Router } from 'express';
import {
  getRequestTypes,
  getActiveRequestTypes,
  getRequestTypeById,
  createRequestType,
  updateRequestType,
  deleteRequestType
} from '../controllers/requestType.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const requestTypeRouter = Router();

// Public/authenticated helper to get active request types
requestTypeRouter.get('/active', getActiveRequestTypes);

// Protected CRUD routes
requestTypeRouter.use(authenticate);

requestTypeRouter.get('/', requirePermission('request_types.view'), getRequestTypes);
requestTypeRouter.get('/:id', requirePermission('request_types.view'), getRequestTypeById);
requestTypeRouter.post('/', requirePermission('request_types.create'), createRequestType);
requestTypeRouter.patch('/:id', requirePermission('request_types.update'), updateRequestType);
requestTypeRouter.delete('/:id', requirePermission('request_types.delete'), deleteRequestType);
