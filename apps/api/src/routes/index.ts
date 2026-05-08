import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import healthRoutes from '@/modules/health/health.routes';

const router = Router();

// Health check - no prefix
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

export default router;
