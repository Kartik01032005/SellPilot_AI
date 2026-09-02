import { Router } from 'express';
import { AgentController } from '../controllers/agentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Machine-readable discovery endpoints. Product facts are always sourced from the catalog.
router.get('/catalog', AgentController.getCatalog);
router.get('/products/:id', AgentController.getProduct);
router.post('/search', AgentController.search);

// Consequential buyer operations require an authenticated customer session so carts
// cannot fall back to a shared/default session.
router.post('/cart', authenticateToken, requireRole(['customer']), AgentController.cartOperation);
router.post('/checkout', authenticateToken, requireRole(['customer']), AgentController.checkout);

export default router;

