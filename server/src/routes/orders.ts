import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, OrderController.createOrder);
router.post('/payment/verify', authenticateToken, OrderController.verifyOrderPayment);
router.get('/', authenticateToken, OrderController.getUserOrders);
router.get('/:id/timeline', authenticateToken, OrderController.getTimeline);
router.get('/:id', authenticateToken, OrderController.getOrderById);
router.patch('/:id/cancel', authenticateToken, OrderController.cancelOrder);

export default router;

