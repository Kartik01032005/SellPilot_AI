import { Response, NextFunction } from 'express';
import { MerchantService } from '../services/merchantService';
import { ProductService } from '../services/productService';
import { SeedService } from '../services/seedService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { User } from '../models/User';

export class MerchantController {
  public static async getInsights(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let merchantId = req.user?.merchantId;
      if (!merchantId && req.user?.userId) {
        const user = await User.findById(req.user.userId).select('merchantId');
        if (user?.merchantId) {
          merchantId = user.merchantId.toString();
        }
      }
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
      let merchantId = req.user?.merchantId;
      if (!merchantId && req.user?.userId) {
        const user = await User.findById(req.user.userId).select('merchantId');
        if (user?.merchantId) {
          merchantId = user.merchantId.toString();
        }
      }
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      await SeedService.seedCatalogIfEmpty(merchantId);

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
