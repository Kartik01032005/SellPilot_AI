import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

router.post('/', RecommendationController.getRecommendations);
router.post('/upsell', RecommendationController.getUpsell);
router.get('/upsell', RecommendationController.getUpsell);
router.post('/cross-sell', RecommendationController.getCrossSell);
router.get('/cross-sell', RecommendationController.getCrossSell);
router.get('/product/:productId', RecommendationController.getProductRecommendations);
router.post('/product/:productId', RecommendationController.getProductRecommendations);

export default router;
