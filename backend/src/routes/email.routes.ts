import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/threads', authMiddleware, (req, res) => emailController.getThreads(req, res));
router.get('/threads/:threadId', authMiddleware, (req, res) => emailController.getThreadDetails(req, res));
router.post('/draft', authMiddleware, (req, res) => emailController.generateAIDraft(req, res));
router.post('/send', authMiddleware, (req, res) => emailController.sendNewEmail(req, res));
router.post('/reply', authMiddleware, (req, res) => emailController.sendReply(req, res));

export default router;
