import { Router } from 'express';
import { ragController } from '../controllers/rag.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/query', authMiddleware, (req, res) => ragController.askQuestion(req, res));
router.get('/sessions', authMiddleware, (req, res) => ragController.getChatSessions(req, res));
router.get('/sessions/:sessionId', authMiddleware, (req, res) => ragController.getChatHistory(req, res));

export default router;
