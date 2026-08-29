import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, ConversationController.createConversation);
router.get('/', authenticateToken, ConversationController.getUserConversations);
router.get('/:id', authenticateToken, ConversationController.getConversationById);
router.post('/:id/messages', authenticateToken, ConversationController.addMessage);

export default router;
