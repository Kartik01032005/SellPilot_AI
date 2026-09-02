import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/ai/chat - Optional authentication so guests can browse products while logged in users get full history
router.post('/chat', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  next();
}, AIController.chat);

// POST /api/ai/intent
router.post('/intent', AIController.detectIntent);

// GET /api/ai/tools - List all registered agent tools
router.get('/tools', AIController.getTools);

// POST /api/ai/tools/execute - Execute a specific agent tool
router.post('/tools/execute', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  next();
}, AIController.executeTool);

export default router;
