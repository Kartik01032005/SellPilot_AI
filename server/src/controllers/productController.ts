import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../services/productService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { SeedService } from '../services/seedService';
import { User } from '../models/User';

export class ProductController {
  public static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, minPrice, maxPrice, search, available, merchantId } = req.query;

      const products = await ProductService.getProducts({
        category: category as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        search: search as string,
        available: available === 'true',
        merchantId: merchantId as string,
      });

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId;
      if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
        throw new CustomError('A valid authenticated merchantId is required', 403, 'MERCHANT_ID_REQUIRED');
      }
      const { name, description, category, price, currency, stock, sku, features, tags, relatedProducts } = req.body;

      const product = await ProductService.createProduct({
        merchantId,
        name,
        description,
        category,
        price,
        currency,
        stock,
        sku,
        features,
        tags,
        relatedProducts,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId;
      if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
        throw new CustomError('A valid authenticated merchantId is required', 403, 'MERCHANT_ID_REQUIRED');
      }

      const updated = await ProductService.updateProduct(id, merchantId, req.body);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      let merchantId = req.user?.merchantId;
      if (!merchantId && req.user?.userId) {
        const user = await User.findById(req.user.userId).select('merchantId');
        if (user?.merchantId) {
          merchantId = user.merchantId.toString();
        }
      }
      if (!merchantId && req.headers['x-merchant-id']) {
        merchantId = req.headers['x-merchant-id'] as string;
      }
      if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
        throw new CustomError('A valid authenticated merchantId is required', 403, 'MERCHANT_ID_REQUIRED');
      }

      const product = await ProductService.deleteProduct(id, merchantId);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAICatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchantId } = req.query;
      const products = await ProductService.getAICatalog(merchantId as string);

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async seedProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SeedService.seedCatalogIfEmpty(req.user?.merchantId);

      res.status(200).json({
        success: true,
        message: 'Catalog seeded successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
