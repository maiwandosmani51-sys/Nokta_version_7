import { Router } from 'express';
import { getApiOverview, healthCheck } from '../controllers/system.controller';

export const systemRouter = Router();

systemRouter.get('/health', healthCheck);
systemRouter.get('/', getApiOverview);
