import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/create-order', authenticateToken, PaymentController.createOrder);
router.post('/verify', authenticateToken, PaymentController.verifyPayment);
router.post('/failure', authenticateToken, PaymentController.recordPaymentFailure);
router.post('/cancel', authenticateToken, PaymentController.cancelPayment);
router.get('/:orderId/status', authenticateToken, PaymentController.getPaymentStatus);

export default router;
