import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/setting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const settingRouter = Router();

settingRouter.use(authenticate);

settingRouter.get('/', requirePermission('settings.manage'), getSystemSettings);
settingRouter.put('/', requirePermission('settings.manage'), updateSystemSettings);