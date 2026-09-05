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

    const upsellFilter: Record<string, unknown> = {
      category: currentProduct.category,
      price: { $gt: currentProduct.price },
      stock: { $gt: 0 },
      isActive: true,
      _id: { $ne: currentProduct._id },
    };
    if (currentProduct.merchantId) {
      upsellFilter.merchantId = currentProduct.merchantId;
    }

    let upsellOption = await Product.findOne(upsellFilter).sort({ price: 1 });

    // Fallback: If no higher price in same category, check if an alternative top-tier configuration exists
    if (!upsellOption) {
      const altFilter: Record<string, unknown> = {
        category: currentProduct.category,
        stock: { $gt: 0 },
        isActive: true,
        _id: { $ne: currentProduct._id },
      };
      if (currentProduct.merchantId) altFilter.merchantId = currentProduct.merchantId;
      upsellOption = await Product.findOne(altFilter).sort({ price: -1 });
    }

    if (!upsellOption || upsellOption._id.toString() === currentProduct._id.toString()) {
      return null;
    }

    const priceDiff = Math.max(0, upsellOption.price - currentProduct.price);
    return {
      productId: upsellOption._id.toString(),
      name: upsellOption.name,
      price: upsellOption.price,
      currency: upsellOption.currency || 'INR',
      reason:
        priceDiff > 0
          ? `Premium upgrade offering higher performance and durability for ₹${priceDiff.toLocaleString('en-IN')} more.`
          : `Top-rated alternative in ${currentProduct.category}.`,
      priceDiff,
    };
  }

  public static async getCrossSellRecommendation(productId: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const currentProduct = await Product.findById(productId).populate('relatedProducts', 'name price category stock currency isActive merchantId');
    if (!currentProduct) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    let related = ((currentProduct.relatedProducts as any[]) || []).filter(
      (p) => p && p.isActive && p.stock > 0 && (!currentProduct.merchantId || !p.merchantId || p.merchantId.toString() === currentProduct.merchantId.toString())
    );

    // If no explicit relatedProducts linked, provide smart complementary pairing from accessories/electronics
    if (related.length === 0) {
      const fallbackFilter: Record<string, unknown> = {
        _id: { $ne: currentProduct._id },
        isActive: true,
        stock: { $gt: 0 },
      };
      if (currentProduct.merchantId) {
        fallbackFilter.merchantId = currentProduct.merchantId;
      }

      if (currentProduct.category === 'Laptops' || currentProduct.category === 'Electronics') {
        fallbackFilter.category = { $in: ['Accessories', 'Electronics'] };
      } else if (currentProduct.category === 'Shoes' || currentProduct.category === 'Clothing') {
        fallbackFilter.category = { $in: ['Accessories', 'Clothing'] };
      } else if (currentProduct.category === 'Phones' || currentProduct.category === 'Cameras') {
        fallbackFilter.category = { $in: ['Accessories', 'Electronics'] };
      } else {
        fallbackFilter.category = { $ne: currentProduct.category };
      }

      const fallbacks = await Product.find(fallbackFilter).limit(2).exec();
      related = fallbacks;
    }

    return related.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      price: p.price,
      currency: p.currency || 'INR',
      category: p.category,
      reason: `Complementary item that pairs excellently with ${currentProduct.name}.`,
    }));
  }

  public static async getProductRecommendations(productId: string) {
    const [upsell, crossSells] = await Promise.all([
      this.getUpsellRecommendation(productId).catch(() => null),
      this.getCrossSellRecommendation(productId).catch(() => []),
    ]);

    return {
      upsell,
      crossSells,
    };
  }
}
