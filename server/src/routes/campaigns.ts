import { Router } from 'express';
import { CampaignController } from '../controllers/campaignController';
import { authenticateToken, requireMerchant } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, requireMerchant, CampaignController.createCampaign);
router.get('/', authenticateToken, requireMerchant, CampaignController.getMerchantCampaigns);
router.get('/:id', authenticateToken, requireMerchant, CampaignController.getCampaignById);
router.post('/:id/approve', authenticateToken, requireMerchant, CampaignController.approveCampaign);
router.post('/:id/activate', authenticateToken, requireMerchant, CampaignController.activateCampaign);

export default router;
