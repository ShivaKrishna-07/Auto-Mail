import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/threads', authMiddleware, (req, res) => emailController.getThreads(req, res));
router.get('/threads/:threadId', authMiddleware, (req, res) => emailController.getThreadDetails(req, res));
router.post('/draft', authMiddleware, (req, res) => emailController.generateAIDraft(req, res));
router.post('/send', authMiddleware, (req, res) => emailController.sendNewEmail(req, res));
router.post('/reply', authMiddleware, (req, res) => emailController.sendReply(req, res));
router.post('/threads/:threadId/summarize', authMiddleware, (req, res) => emailController.summarizeThread(req, res));
router.post('/threads/:threadId/categorize', authMiddleware, (req, res) => emailController.categorizeThread(req, res));
router.get('/uncategorized-count', authMiddleware, (req, res) => emailController.getUncategorizedCount(req, res));
router.post('/categorize-all', authMiddleware, (req, res) => emailController.categorizeAll(req, res));

export default router;
