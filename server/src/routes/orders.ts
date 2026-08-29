import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, OrderController.createOrder);
router.get('/', authenticateToken, OrderController.getUserOrders);
router.get('/:id', authenticateToken, OrderController.getOrderById);

export default router;
