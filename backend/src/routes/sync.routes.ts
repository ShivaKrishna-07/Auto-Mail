import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/trigger', authMiddleware, (req, res) => syncController.triggerSync(req, res));
router.get('/status', authMiddleware, (req, res) => syncController.getSyncStatus(req, res));

export default router;
