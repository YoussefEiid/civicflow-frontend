import { Router } from 'express';
import {
  getMinistries,
  getMinistryById,
  createMinistry,
  updateMinistry,
  deleteMinistry
} from '../controllers/ministry.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const ministryRouter = Router();

ministryRouter.use(authenticate);

ministryRouter.get('/', requirePermission('ministries.view'), getMinistries);
ministryRouter.get('/:id', requirePermission('ministries.view'), getMinistryById);
ministryRouter.post('/', requirePermission('ministries.create'), createMinistry);
ministryRouter.patch('/:id', requirePermission('ministries.update'), updateMinistry);
ministryRouter.delete('/:id', requirePermission('ministries.delete'), deleteMinistry);