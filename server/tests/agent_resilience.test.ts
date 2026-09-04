import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import agentRouter from '../src/routes/agent';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { ProductService } from '../src/services/productService';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { PaymentService } from '../src/services/paymentService';
import { AuditService } from '../src/services/auditService';
import { ConversationCartService } from '../src/services/conversationCartService';
import {
  setAiProvider,
} from '../src/services/agentRevenueRecommendationService';

describe('Step 6 — Graceful Failure Handling & Resilience in AI Commerce Flow', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter);
  app.use(errorHandler);

  const primaryMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
  const differentMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439099');
  const customerUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013').toString();

  const customerToken = jwt.sign(
    {
      userId: customerUserId,
      email: 'customer@buyer.com',
      role: 'customer',
      merchantId: primaryMerchantId.toString(),
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const otherMerchantCustomerToken = jwt.sign(
    {
      userId: customerUserId,
      email: 'customer@buyer.com',
      role: 'customer',
      merchantId: differentMerchantId.toString(),
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const baseShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const upsellShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014').toString();
  const inactiveShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022').toString();
  const outOfStockShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439033').toString();
  const limitedStockShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439044').toString();
  const otherMerchantShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439055').toString();

  const mockDbProducts: Record<string, any> = {
    [baseShoeId]: {
      _id: new mongoose.Types.ObjectId(baseShoeId),
      name: 'Standard Daily Trainer',
      category: 'Shoes',
      price: 2000,
      currency: 'INR',
      stock: 20,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [upsellShoeId]: {
      _id: new mongoose.Types.ObjectId(upsellShoeId),
      name: 'Pro Speed Carbon Racer',
      category: 'Shoes',
      price: 4500,
      currency: 'INR',
      stock: 10,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [inactiveShoeId]: {
      _id: new mongoose.Types.ObjectId(inactiveShoeId),
      name: 'Discontinued Vintage Runner',
      category: 'Shoes',
      price: 1500,
      currency: 'INR',
      stock: 10,
      isActive: false,
      merchantId: primaryMerchantId,
    },
    [outOfStockShoeId]: {
      _id: new mongoose.Types.ObjectId(outOfStockShoeId),
      name: 'Sold Out Limited Edition',
      category: 'Shoes',
      price: 5000,
      currency: 'INR',
      stock: 0,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [limitedStockShoeId]: {
      _id: new mongoose.Types.ObjectId(limitedStockShoeId),
      name: 'Ultra Rare Track Spike',
      category: 'Shoes',
      price: 3000,
      currency: 'INR',
      stock: 1,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [otherMerchantShoeId]: {
      _id: new mongoose.Types.ObjectId(otherMerchantShoeId),
      name: 'Rival Merchant Runner',
      category: 'Shoes',
      price: 2200,
      currency: 'INR',
      stock: 15,
      isActive: true,
      merchantId: differentMerchantId,
    },
  };

  const sampleCatalog = Object.values(mockDbProducts).map((p) => ({
    id: p._id.toString(),
    productId: p._id.toString(),
    name: p.name,
    description: 'Description for ' + p.name,
    category: p.category,
    price: p.price,
    currency: p.currency,
    available: p.stock > 0 && p.isActive,
    availability: p.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    inventory: p.stock,
    stock: p.stock,
    features: ['Comfort'],
    tags: ['running'],
    merchantId: p.merchantId.toString(),
    active: p.isActive,
    isActive: p.isActive,
    relatedProducts: [],
  }));

  let orderCreateSpy: jest.SpyInstance;
  let paymentInitSpy: jest.SpyInstance;
  let auditActionFailedSpy: jest.SpyInstance;
  let auditRecommendationRejectedSpy: jest.SpyInstance;

  beforeEach(() => {
    ConversationCartService.clearCart(customerUserId);
    jest.restoreAllMocks();

    // Spies to prove zero side effects on critical systems
    orderCreateSpy = jest.spyOn(Order, 'create').mockImplementation(() => {
      throw new Error('Order.create should NEVER be called in failure flows');
    });

    paymentInitSpy = jest.spyOn(PaymentService, 'createRazorpayOrder').mockImplementation(() => {
      throw new Error('PaymentService should NEVER be called in failure flows');
    });

    auditActionFailedSpy = jest.spyOn(AuditService, 'logActionFailed').mockResolvedValue(null as any);
    auditRecommendationRejectedSpy = jest.spyOn(AuditService, 'logRecommendationRejected').mockResolvedValue(null as any);

    jest.spyOn(ProductService, 'getAICatalog').mockImplementation(async (mId?: string) => {
      if (mId) {
        return sampleCatalog.filter((p) => p.merchantId === mId.toString()) as any;
      }
      return sampleCatalog as any;
    });

    jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const found = mockDbProducts[idStr];
      return Promise.resolve(found ? { ...found } : null) as any;
    });
  });

  afterEach(() => {
    setAiProvider(null);
  });

  describe('1. AI / Gemini Failure or Timeout Handling', () => {
    it('gracefully returns RECOMMENDATION_UNAVAILABLE when AI provider throws an error or times out', async () => {
      setAiProvider(async () => {
        throw new Error('Gemini upstream timeout (ETIMEDOUT 504)');
      });

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.recommendations).toEqual([]);
      expect(res.body.reason).toBe('RECOMMENDATION_UNAVAILABLE');

      // Audit trail logs failure
      expect(auditRecommendationRejectedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          reason: 'RECOMMENDATION_UNAVAILABLE',
        })
      );

      // Cart state remains completely untouched
      const cart = ConversationCartService.getCart(customerUserId);
      expect(cart.items).toEqual([]);

      // Zero order or payment side effects
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });

  describe('2. Invalid or Hallucinated Recommendations', () => {
    it('rejects hallucinated product IDs and non-existent catalog items', async () => {
      const hallucinatedId = new mongoose.Types.ObjectId().toString();
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: hallucinatedId,
          productName: 'Invented Dream Shoe',
          price: 9999,
          reason: 'Hallucinated shoe that does not exist',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.recommendations).toEqual([]);
      expect(res.body.reason).toBe('RECOMMENDATION_UNAVAILABLE');

      expect(auditRecommendationRejectedSpy).toHaveBeenCalled();
      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
    });

    it('rejects AI recommendations proposing products from another merchant store', async () => {
      setAiProvider(async () => [
        {
          type: 'CROSS_SELL',
          productId: otherMerchantShoeId,
          productName: 'Rival Merchant Runner',
          price: 2200,
          reason: 'Cross merchant leakage attempt',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.recommendations).toEqual([]);
      expect(res.body.reason).toBe('RECOMMENDATION_UNAVAILABLE');
    });
  });

  describe('3. Deleted / Non-Existent Products (Post-Recommendation Failure)', () => {
    it('safely rejects action when product was deleted from DB prior to user approval', async () => {
      const deletedProductId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: deletedProductId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');

      // Cart remains completely unchanged
      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);

      // Failure recorded in audit trail
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: deletedProductId,
          errorCode: 'PRODUCT_NOT_FOUND',
        })
      );

      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Inactive Products (Post-Recommendation Invalidation)', () => {
    it('safely rejects action when product status became inactive before approval', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: inactiveShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PRODUCT_INACTIVE');

      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: inactiveShoeId,
          errorCode: 'PRODUCT_INACTIVE',
        })
      );
      expect(orderCreateSpy).not.toHaveBeenCalled();
    });
  });

  describe('5. Out-of-Stock and Inventory Reduction Race Conditions', () => {
    it('safely rejects out-of-stock products with 400 OUT_OF_STOCK', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: outOfStockShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUT_OF_STOCK');

      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: outOfStockShoeId,
          errorCode: 'OUT_OF_STOCK',
        })
      );
    });

    it('safely rejects action when stock changed after recommendation (concurrency / race)', async () => {
      // Product had stock 5 when recommended, but concurrent purchase reduced it to 1
      jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
        if (id?.toString() === limitedStockShoeId) {
          return Promise.resolve({
            ...mockDbProducts[limitedStockShoeId],
            stock: 1, // Only 1 left now
          }) as any;
        }
        return Promise.resolve(mockDbProducts[id?.toString()]) as any;
      });

      // User attempts to add quantity 2
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: limitedStockShoeId,
          quantity: 2,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUT_OF_STOCK');

      // Cart state unchanged
      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: limitedStockShoeId,
          errorCode: 'OUT_OF_STOCK',
        })
      );
    });
  });

  describe('6. Price Change Invariance (Authoritative Catalog Truth)', () => {
    it('ignores client-sent stale or manipulated prices and uses real-time catalog price', async () => {
      // Catalog price is ₹4,500
      // Client sends stale recommendation price of ₹2,000 or spoofed ₹10
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: upsellShoeId,
          quantity: 1,
          price: 10, // Attempted price manipulation
          userApproved: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.item.price).toBe(4500); // Authoritative DB price
      expect(res.body.item.lineTotal).toBe(4500);

      const cart = ConversationCartService.getCart(customerUserId);
      expect(cart.items[0].price).toBe(4500);
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });

  describe('7. Merchant Store Mismatch Handling', () => {
    it('safely rejects cart actions targeting products from a different merchant store', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${otherMerchantCustomerToken}`)
        .send({
          productId: upsellShoeId, // Belongs to primaryMerchantId
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MERCHANT_MISMATCH');

      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: upsellShoeId,
          errorCode: 'MERCHANT_MISMATCH',
        })
      );
    });
  });

  describe('8. Invalid Quantity Validation', () => {
    it.each([
      [0, 'zero quantity'],
      [-2, 'negative quantity'],
      [1.5, 'fractional quantity'],
      [101, 'exceeding 100 limit'],
    ])('rejects %s (%s) with 400 INVALID_QUANTITY', async (qty) => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: baseShoeId,
          quantity: qty,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUANTITY');

      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          errorCode: 'INVALID_QUANTITY',
        })
      );
    });
  });

  describe('9. Duplicate Approval / Rapid Clicks (Bounded Against Stock)', () => {
    it('safely handles rapid repeated approvals without exceeding inventory or corrupting cart', async () => {
      // limitedStockShoeId has stock: 1
      // User clicks approve twice
      const firstClick = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: limitedStockShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(firstClick.status).toBe(200);
      expect(firstClick.body.success).toBe(true);

      // Cart now has quantity 1
      let cart = ConversationCartService.getCart(customerUserId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(1);

      // Second rapid click attempts to add 1 more, but stock is only 1!
      const secondClick = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: limitedStockShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(secondClick.status).toBe(400);
      expect(secondClick.body.error.code).toBe('OUT_OF_STOCK');

      // Cart is NOT corrupted; remains safely at quantity 1
      cart = ConversationCartService.getCart(customerUserId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(1);

      // Second click failure was audited
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: limitedStockShoeId,
          errorCode: 'OUT_OF_STOCK',
        })
      );

      // Still no order or payment side effects
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });

  describe('10. Cart / Action Internal API Failure Recovery', () => {
    it('recovers safely when cart service encounters an unexpected failure', async () => {
      jest
        .spyOn(ConversationCartService, 'addProductItem')
        .mockRejectedValueOnce(new Error('Internal storage IO failure'));

      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: baseShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(500);

      // Audit logged failure
      expect(auditActionFailedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          productId: baseShoeId,
          errorCode: 'UNKNOWN_ERROR',
        })
      );

      // No orders, no payment side effects
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });

  describe('11. Zero Financial & Inventory Side Effects Invariant', () => {
    it('verifies that no database orders, Razorpay triggers, or inventory mutations occur on any rejected action', async () => {
      // Attempt multiple invalid operations
      await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: outOfStockShoeId, quantity: 1, userApproved: true });

      await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: inactiveShoeId, quantity: 1, userApproved: true });

      await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${otherMerchantCustomerToken}`)
        .send({ productId: upsellShoeId, quantity: 1, userApproved: true });

      // Invariants
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
      expect(ConversationCartService.getCart(customerUserId).items).toHaveLength(0);
    });
  });
});
