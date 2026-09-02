import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, requireMerchant, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', ProductController.getProducts);
router.post('/seed', authenticateToken, requireRole(['admin']), ProductController.seedProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authenticateToken, requireMerchant, ProductController.createProduct);
router.put('/:id', authenticateToken, requireMerchant, ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireMerchant, ProductController.deleteProduct);

export default router;
