import { Router } from 'express';
import { MerchantController } from '../controllers/merchantController';
import { CampaignController } from '../controllers/campaignController';
import { authenticateToken, requireMerchant } from '../middleware/auth';

const router = Router();

router.get('/insights', authenticateToken, requireMerchant, MerchantController.getInsights);
router.get('/products', authenticateToken, requireMerchant, MerchantController.getMerchantProducts);
router.post('/discount/validate', authenticateToken, requireMerchant, CampaignController.validateDiscount);

export default router;
