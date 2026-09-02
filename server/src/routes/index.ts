import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import productsRouter from './products';
import catalogRouter from './catalog';
import ordersRouter from './orders';
import checkoutRouter from './checkout';
import paymentRouter from './payment';
import campaignsRouter from './campaigns';
import merchantRouter from './merchant';
import recommendationsRouter from './recommendations';
import conversationsRouter from './conversations';
import auditRouter from './audit';
import aiRouter from './ai';
import agentRouter from './agent';

const router = Router();

// Mount foundational API endpoints
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/ai', aiRouter);
router.use('/agent', agentRouter);
router.use('/products', productsRouter);
router.use('/catalog', catalogRouter);
router.use('/orders', ordersRouter);
router.use('/checkout', checkoutRouter);
router.use('/payment', paymentRouter);
router.use('/campaigns', campaignsRouter);
router.use('/merchant', merchantRouter);
router.use('/recommendations', recommendationsRouter);
router.use('/conversations', conversationsRouter);
router.use('/audit', auditRouter);

export default router;
