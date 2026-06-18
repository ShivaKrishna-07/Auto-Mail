import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/google/url', (req, res) => authController.getGoogleAuthUrl(req, res));
router.get('/google/callback', (req, res) => authController.handleGoogleCallback(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));

export default router;
