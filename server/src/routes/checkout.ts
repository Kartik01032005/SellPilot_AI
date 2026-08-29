import { Router } from 'express';
import { OrderController } from '../controllers/orderController';

const router = Router();

// POST /api/checkout/prepare - Prepare checkout and calculate server-verified totals
router.post('/prepare', OrderController.prepareCheckout);

export default router;
