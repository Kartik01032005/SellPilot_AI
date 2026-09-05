import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendationService';
import { CustomError } from '../middleware/errorHandler';

export class RecommendationController {
  public static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, category, maxPrice, merchantId } = req.body;
      const recommendations = await RecommendationService.getRecommendations({
        searchQuery: query,
        category,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        merchantId,
      });

      res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUpsell(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.body?.productId || (req.query?.productId as string);
      if (!productId) {
        throw new CustomError('productId is required', 400, 'INVALID_REQUEST');
      }

      const recommendation = await RecommendationService.getUpsellRecommendation(productId);

      res.status(200).json({
        success: true,
        recommendation,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCrossSell(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.body?.productId || (req.query?.productId as string);
      if (!productId) {
        throw new CustomError('productId is required', 400, 'INVALID_REQUEST');
      }

      const recommendations = await RecommendationService.getCrossSellRecommendation(productId);

      res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params?.productId || req.body?.productId || (req.query?.productId as string);
      if (!productId) {
        throw new CustomError('productId is required', 400, 'INVALID_REQUEST');
      }

      const { upsell, crossSells } = await RecommendationService.getProductRecommendations(productId);

      res.status(200).json({
        success: true,
        productId,
        upsell,
        crossSells,
      });
    } catch (error) {
      next(error);
    }
  }
}
