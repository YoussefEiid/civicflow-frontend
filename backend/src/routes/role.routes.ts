import { Router } from 'express';
import { getRoles, getRoleById, updateRole } from '../controllers/role.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const roleRouter = Router();

roleRouter.use(authenticate);

roleRouter.get('/', requirePermission('roles.view'), getRoles);
roleRouter.get('/:id', requirePermission('roles.view'), getRoleById);
roleRouter.patch('/:id', requirePermission('roles.manage'), updateRole);