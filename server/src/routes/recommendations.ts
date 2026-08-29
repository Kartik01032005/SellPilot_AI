import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

router.post('/', RecommendationController.getRecommendations);
router.post('/upsell', RecommendationController.getUpsell);
router.post('/cross-sell', RecommendationController.getCrossSell);

export default router;
