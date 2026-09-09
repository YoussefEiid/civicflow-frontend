import { Router } from 'express';
import {
  getCities,
  getActiveCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity
} from '../controllers/city.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const cityRouter = Router();

// Public/authenticated helper to get active cities
cityRouter.get('/active', getActiveCities);

// Protected CRUD routes
cityRouter.use(authenticate);

cityRouter.get('/', requirePermission('cities.view'), getCities);
cityRouter.get('/:id', requirePermission('cities.view'), getCityById);
cityRouter.post('/', requirePermission('cities.create'), createCity);
cityRouter.patch('/:id', requirePermission('cities.update'), updateCity);
cityRouter.delete('/:id', requirePermission('cities.delete'), deleteCity);
