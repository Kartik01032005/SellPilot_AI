import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();

// GET /api/catalog/ai - Return structured product information for AI discovery
router.get('/ai', ProductController.getAICatalog);

export default router;
