import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/ai/chat - Optional authentication so guests can browse products while logged in users get full history
router.post('/chat', (req, res, next) => {
  // If authorization header is provided, run authenticateToken
  if (req.headers.authorization) {
    return authenticateToken(req as any, res, next);
  }
  next();
}, AIController.chat);

// POST /api/ai/intent
router.post('/intent', AIController.detectIntent);

export default router;
