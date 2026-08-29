import mongoose from 'mongoose';
import { Recommendation, IRecommendation } from '../models/Recommendation';
import { Product } from '../models/Product';
import { CustomError } from '../middleware/errorHandler';

export interface CreateRecommendationInput {
  merchantId?: string;
  userId?: string;
  type: 'upsell' | 'cross_sell' | 'promotion' | 'campaign' | 'product' | 'growth';
  productId?: string;
  recommendedProductIds: string[];
  reason: string;
  confidence?: number;
}

export class RecommendationService {
  public static async recordRecommendation(input: CreateRecommendationInput): Promise<IRecommendation> {
    const rec = new Recommendation({
      merchantId: input.merchantId ? new mongoose.Types.ObjectId(input.merchantId) : undefined,
      userId: input.userId ? new mongoose.Types.ObjectId(input.userId) : undefined,
      type: input.type,
      productId: input.productId ? new mongoose.Types.ObjectId(input.productId) : undefined,
      recommendedProductIds: input.recommendedProductIds.map((id) => new mongoose.Types.ObjectId(id)),
      reason: input.reason,
      confidence: input.confidence ?? 1.0,
      status: 'pending',
    });

    return await rec.save();
  }

  public static async getRecommendations(query: {
    category?: string;
    maxPrice?: number;
    searchQuery?: string;
    merchantId?: string;
  }) {
    const filter: Record<string, unknown> = { isActive: true, stock: { $gt: 0 } };
    if (query.merchantId) filter.merchantId = query.merchantId;
    if (query.category) filter.category = { $regex: new RegExp(`^${query.category}$`, 'i') };
    if (query.maxPrice !== undefined) filter.price = { $lte: Number(query.maxPrice) };

    const products = await Product.find(filter).limit(5).exec();

    return products.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      price: p.price,
      currency: p.currency,
      category: p.category,
      reason: `Matches your ${query.category || 'product'} requirement and is within your budget.`,
    }));
  }

  public static async getUpsellRecommendation(productId: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    const upsellOption = await Product.findOne({
      category: currentProduct.category,
      price: { $gt: currentProduct.price, $lte: currentProduct.price * 2 },
      stock: { $gt: 0 },
      isActive: true,
      _id: { $ne: currentProduct._id },
    }).sort({ price: 1 });

    if (!upsellOption) {
      return null;
    }

    const priceDiff = upsellOption.price - currentProduct.price;
    return {
      productId: upsellOption._id.toString(),
      name: upsellOption.name,
      price: upsellOption.price,
      currency: upsellOption.currency,
      reason: `This premium option provides higher performance for ₹${priceDiff} more.`,
      priceDiff,
    };
  }

  public static async getCrossSellRecommendation(productId: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const currentProduct = await Product.findById(productId).populate('relatedProducts', 'name price category stock currency isActive');
    if (!currentProduct) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    const related = (currentProduct.relatedProducts as any[]).filter(
      (p) => p && p.isActive && p.stock > 0
    );

    return related.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      price: p.price,
      currency: p.currency || 'INR',
      category: p.category,
      reason: `This product is commonly useful with ${currentProduct.name}.`,
    }));
  }
}
