import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, requireMerchant } from '../middleware/auth';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authenticateToken, requireMerchant, ProductController.createProduct);
router.put('/:id', authenticateToken, requireMerchant, ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireMerchant, ProductController.deleteProduct);

export default router;
