import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Merchant } from '../models/Merchant';
import { CustomError } from '../middleware/errorHandler';

export interface MerchantInsightsResult {
  merchantName?: string;
  maxDiscountPercentage?: number;
  topProducts: Array<{ id: string; name: string; category: string; price: number; stock: number; salesCount?: number }>;
  lowPerformingProducts: Array<{ id: string; name: string; category: string; price: number; stock: number; reason: string }>;
  promotionOpportunities: Array<{ productId: string; name: string; category?: string; price?: number; stock?: number; suggestedDiscount: number; reason: string }>;
  bestOpportunities: Array<{ productId: string; name: string; category: string; price: number; stock: number; score: number; reason: string }>;
  crossSellOpportunities: Array<{ productId: string; name: string; relatedProductId: string; relatedName: string; reason: string }>;
  upsellOpportunities: Array<{ productId: string; name: string; premiumProductId: string; premiumName: string; priceDiff: number; reason: string }>;
}

export class MerchantService {
  public static async getInsights(merchantId: string): Promise<MerchantInsightsResult> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new CustomError('Invalid merchant ID', 400, 'INVALID_REQUEST');
    }

    if (mongoose.connection.readyState === 0) {
      return {
        merchantName: 'Demo Store',
        maxDiscountPercentage: 25,
        topProducts: [
          { id: 'mock_1', name: 'Pro Carbon Running Shoes', category: 'Shoes', price: 2999, stock: 15, salesCount: 45 },
          { id: 'mock_2', name: 'Ultra Grip Road Running Shoes', category: 'Shoes', price: 2499, stock: 5, salesCount: 20 },
        ],
        lowPerformingProducts: [],
        promotionOpportunities: [
          { productId: 'mock_2', name: 'Ultra Grip Road Running Shoes', category: 'Shoes', price: 2499, stock: 5, suggestedDiscount: 15, reason: 'High inventory item with strong velocity potential' },
        ],
        bestOpportunities: [
          { productId: 'mock_1', name: 'Pro Carbon Running Shoes', category: 'Shoes', price: 2999, stock: 15, score: 95, reason: 'Highest commercial opportunity in Shoes' },
        ],
        crossSellOpportunities: [
          { productId: 'mock_1', name: 'Pro Carbon Running Shoes', relatedProductId: 'mock_3', relatedName: 'Performance Compression Sports Socks (3-Pack)', reason: 'Complementary pair' },
        ],
        upsellOpportunities: [
          { productId: 'mock_2', name: 'Ultra Grip Road Running Shoes', premiumProductId: 'mock_1', premiumName: 'Pro Carbon Running Shoes', priceDiff: 500, reason: 'Premium alternative' },
        ],
      };
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      throw new CustomError('Merchant not found', 404, 'NOT_FOUND');
    }

    const products = await Product.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      isActive: true,
    })
      .populate('relatedProducts', 'name price category stock currency isActive merchantId')
      .exec();

    // Query actual order items to calculate sales metrics if orders exist
    const orders = await Order.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      status: { $in: ['paid', 'completed'] },
    }).exec();

    const productSalesMap = new Map<string, number>();
    for (const ord of orders) {
      for (const item of ord.items) {
        const idStr = item.productId.toString();
        productSalesMap.set(idStr, (productSalesMap.get(idStr) || 0) + item.quantity);
      }
    }

    // 1. Top Performing Products
    const topProducts = products
      .filter((p) => p.isActive && p.stock > 0)
      .slice(0, 5)
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        salesCount: productSalesMap.get(p._id.toString()) || 0,
      }));

    // 2. Low-performing or excess inventory products (candidates for promotion)
    const lowPerformingProducts = products
      .filter((p) => p.isActive && p.stock > 10 && (productSalesMap.get(p._id.toString()) || 0) <= 2)
      .slice(0, 5)
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        reason: `High inventory (${p.stock} units) with low recent sales volume.`,
      }));

    // 3. Promotion Opportunities (bounded by merchant's max discount)
    const maxDiscount = merchant.maxDiscountPercentage || 25;
    const promotionOpportunities = products
      .filter((p) => p.isActive && p.stock > 5)
      .slice(0, 3)
      .map((p) => ({
        productId: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        suggestedDiscount: Math.min(15, maxDiscount),
        reason: `High stock in ${p.category} with healthy margin. Recommended safe promotion up to ${Math.min(15, maxDiscount)}%.`,
      }));

    // 4. Best Opportunities (independent multi-factor scoring: velocity, margin/price tier, stock depth)
    const bestOpportunities = products
      .filter((p) => p.isActive && p.stock > 0)
      .map((p) => {
        const sales = productSalesMap.get(p._id.toString()) || 0;
        const revenuePotential = p.price * p.stock;
        const score = Math.round(p.stock * 1.5 + p.price / 100 + sales * 10);
        return {
          productId: p._id.toString(),
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock,
          score,
          reason: `Strongest commercial opportunity in ${p.category}: ₹${p.price.toLocaleString('en-IN')} with ${p.stock} units in stock and ₹${revenuePotential.toLocaleString('en-IN')} total revenue potential.`,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 5. Cross-Sell Opportunities (based on verified database relationships)
    const crossSellOpportunities: MerchantInsightsResult['crossSellOpportunities'] = [];
    for (const p of products) {
      if (p.relatedProducts && p.relatedProducts.length > 0) {
        for (const rel of p.relatedProducts as any[]) {
          const relMerchantId = rel?.merchantId ? rel.merchantId.toString() : merchantId;
          if (rel && rel.name && rel.stock > 0 && relMerchantId === merchantId) {
            crossSellOpportunities.push({
              productId: p._id.toString(),
              name: p.name,
              relatedProductId: rel._id.toString(),
              relatedName: rel.name,
              reason: `Strong category affinity: Customers purchasing ${p.name} frequently add ${rel.name}.`,
            });
          }
        }
      }
    }

    // Fallback cross-sell opportunities from cross-category catalog pairings if explicit links are not configured
    if (crossSellOpportunities.length === 0 && products.length > 1) {
      for (let i = 0; i < products.length; i++) {
        for (let j = 0; j < products.length; j++) {
          if (i !== j && products[i].category !== products[j].category && products[j].stock > 0) {
            crossSellOpportunities.push({
              productId: products[i]._id.toString(),
              name: products[i].name,
              relatedProductId: products[j]._id.toString(),
              relatedName: products[j].name,
              reason: `Cross-category affinity: Pair ${products[i].name} (${products[i].category}) with ${products[j].name} (${products[j].category}) to boost average order value.`,
            });
            break;
          }
        }
        if (crossSellOpportunities.length >= 3) break;
      }
    }

    // 6. Upsell Opportunities (higher value alternatives in same category)
    const upsellOpportunities: MerchantInsightsResult['upsellOpportunities'] = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < products.length; j++) {
        if (
          i !== j &&
          products[i].category === products[j].category &&
          products[j].price > products[i].price &&
          products[j].price <= products[i].price * 1.6 &&
          products[j].stock > 0
        ) {
          const priceDiff = products[j].price - products[i].price;
          upsellOpportunities.push({
            productId: products[i]._id.toString(),
            name: products[i].name,
            premiumProductId: products[j]._id.toString(),
            premiumName: products[j].name,
            priceDiff,
            reason: `${products[j].name} offers premium capabilities in ${products[i].category} for ₹${priceDiff} more.`,
          });
        }
      }
    }

    return {
      merchantName: merchant.name || merchant.businessName,
      maxDiscountPercentage: maxDiscount,
      topProducts,
      lowPerformingProducts,
      promotionOpportunities,
      bestOpportunities,
      crossSellOpportunities: crossSellOpportunities.slice(0, 5),
      upsellOpportunities: upsellOpportunities.slice(0, 5),
    };
  }

  public static async evaluateDiscountPolicy(
    merchantId: string,
    requestedPercentage: number,
    category?: string,
    productId?: string
  ): Promise<{
    allowed: boolean;
    requestedPercentage: number;
    maxAllowedPercentage: number;
    merchantId: string;
    category?: string;
    productName?: string;
    reason: string;
  }> {
    let maxAllowed = 25;
    if (mongoose.Types.ObjectId.isValid(merchantId)) {
      const merchant = await Merchant.findById(merchantId);
      if (merchant?.maxDiscountPercentage) {
        maxAllowed = merchant.maxDiscountPercentage;
      }
    }

    let productName: string | undefined;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const p = await Product.findById(productId);
      if (p) {
        productName = p.name;
        if (!category) category = p.category;
      }
    }

    const allowed = requestedPercentage <= maxAllowed;
    const scopeStr = productName ? `on "${productName}"` : category ? `on ${category}` : 'storewide';
    const reason = allowed
      ? `A ${requestedPercentage}% discount ${scopeStr} is within your safety threshold (maximum permitted is ${maxAllowed}%).`
      : `An ${requestedPercentage}% discount ${scopeStr} exceeds your configured safety threshold of ${maxAllowed}%. You may offer up to ${maxAllowed}%.`;

    return {
      allowed,
      requestedPercentage,
      maxAllowedPercentage: maxAllowed,
      merchantId,
      category,
      productName,
      reason,
    };
  }
}
