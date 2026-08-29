import { Response, NextFunction } from 'express';
import { MerchantService } from '../services/merchantService';
import { ProductService } from '../services/productService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class MerchantController {
  public static async getInsights(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const insights = await MerchantService.getInsights(merchantId);

      res.status(200).json({
        success: true,
        insights,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMerchantProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const products = await ProductService.getProducts({ merchantId });

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      next(error);
    }
  }
}
