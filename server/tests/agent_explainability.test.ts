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
import {
  AgentRevenueRecommendationService,
  setAiProvider,
} from '../src/services/agentRevenueRecommendationService';

describe('Step 4 — Explainable AI Commerce Recommendations', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter);
  app.use(errorHandler);

  const merchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012').toString();
  const customerUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013').toString();

  const customerToken = jwt.sign(
    {
      userId: customerUserId,
      email: 'customer@buyer.com',
      role: 'customer',
      merchantId,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const baseShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const baseSockId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014').toString();
  const upsellShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439015').toString();
  const crossSellBottleId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439016').toString();

  const sampleCatalog = [
    {
      id: baseShoeId,
      productId: baseShoeId,
      name: 'Standard Daily Trainer',
      description: 'Reliable everyday running shoe',
      category: 'Shoes',
      price: 2000,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 20,
      features: ['Cushioning'],
      tags: ['running'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [crossSellBottleId],
    },
    {
      id: baseSockId,
      productId: baseSockId,
      name: 'Anti-Blister Running Socks',
      description: 'Comfortable technical running socks',
      category: 'Accessories',
      price: 500,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 50,
      features: ['Seamless toe'],
      tags: ['socks'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [baseShoeId],
    },
    {
      id: upsellShoeId,
      productId: upsellShoeId,
      name: 'Pro Elite Carbon Racer',
      description: 'Maximum energy return with carbon plate',
      category: 'Shoes',
      price: 4500,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 10,
      features: ['Carbon plate', 'Pebax foam'],
      tags: ['racing'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [crossSellBottleId],
    },
    {
      id: crossSellBottleId,
      productId: crossSellBottleId,
      name: 'Insulated Sports Water Bottle',
      description: 'Keeps water cold during long runs',
      category: 'Accessories',
      price: 600,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 30,
      features: ['Double-wall vacuum', 'BPA free'],
      tags: ['hydration'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [baseShoeId],
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(ProductService, 'getAICatalog').mockResolvedValue(sampleCatalog as any);
  });

  afterEach(() => {
    setAiProvider(null);
  });

  describe('1. Explainability Schema & Mandatory Fields Contract', () => {
    it('returns all required explainability fields for each recommendation', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Upgrades your daily run with race-day carbon technology.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recommendations).toHaveLength(1);

      const rec = res.body.recommendations[0];

      // 1. Product Name
      expect(rec.productName).toBe('Pro Elite Carbon Racer');
      // 2. Authoritative Price
      expect(rec.price).toBe(4500);
      // 3. Reason
      expect(rec.reason).toBe('Upgrades your daily run with race-day carbon technology.');
      // 4. Current Cart Total
      expect(rec.currentCartTotal).toBe(2000);
      // 5. Quantity Being Added
      expect(rec.quantityAdded).toBe(1);
      // 6. Calculated New Cart Total
      expect(rec.newCartTotal).toBe(6500);
      // 7. Factual Explanation String
      expect(typeof rec.explanation).toBe('string');
      expect(rec.explanation).toContain('Pro Elite Carbon Racer');
      expect(rec.explanation).toContain('4,500');
      expect(rec.explanation).toContain('2,000');
      expect(rec.explanation).toContain('6,500');
    });
  });

  describe('2. Authoritative Cart Total and Quantity Math Calculations', () => {
    it('correctly calculates currentCartTotal from multiple items and quantities', async () => {
      // Cart: 2 pairs of base shoes (2 * 2000 = 4000) + 3 pairs of socks (3 * 500 = 1500) = 5500
      setAiProvider(async () => [
        {
          type: 'CROSS_SELL',
          productId: crossSellBottleId,
          reason: 'Essential hydration for training sessions.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [
            { productId: baseShoeId, quantity: 2 },
            { productId: baseSockId, quantity: 3 },
          ],
        });

      expect(res.status).toBe(200);
      const rec = res.body.recommendations[0];

      // Current cart total must authoritatively be 5500
      expect(rec.currentCartTotal).toBe(5500);
      expect(rec.price).toBe(600);
      expect(rec.quantityAdded).toBe(1);
      // New cart total must authoritatively be 5500 + 600 = 6100
      expect(rec.newCartTotal).toBe(6100);
      expect(rec.newCartTotal).toBe(rec.currentCartTotal + rec.price * rec.quantityAdded);
    });
  });

  describe('3. Rejection of Client-Manipulated Prices and Totals', () => {
    it('ignores client attempts to spoof currentCartTotal, price, or newCartTotal', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Premium performance upgrade.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
          // Client attempts to tamper with prices & totals in request body
          price: 1,
          currentCartTotal: 10,
          newCartTotal: 11,
          quantityAdded: 999,
          fakeDiscount: 5000,
        });

      expect(res.status).toBe(200);
      const rec = res.body.recommendations[0];

      // Server strictly ignored the client spoofing:
      expect(rec.price).toBe(4500);
      expect(rec.currentCartTotal).toBe(2000);
      expect(rec.quantityAdded).toBe(1);
      expect(rec.newCartTotal).toBe(6500);
    });
  });

  describe('4. Seamless Transition to Step 3 Approved Cart Action', () => {
    it('allows user to approve the explainable recommendation via POST /api/agent/actions/add-to-cart', async () => {
      // Mock Product.findById for Step 3 action endpoint
      jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
        const idStr = id ? id.toString() : '';
        const found = sampleCatalog.find((p) => p.productId === idStr);
        return Promise.resolve(found ? { ...found, _id: new mongoose.Types.ObjectId(found.productId) } : null) as any;
      });

      // 1. Fetch explainable recommendation
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Next-level speed for race day.',
        },
      ]);

      const recRes = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(recRes.status).toBe(200);
      const recommendation = recRes.body.recommendations[0];

      // 2. User explicitly clicks and approves adding the recommended item
      const actionRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: recommendation.productId,
          quantity: recommendation.quantityAdded,
          userApproved: true,
        });

      expect(actionRes.status).toBe(200);
      expect(actionRes.body.success).toBe(true);
      expect(actionRes.body.approved).toBe(true);
      expect(actionRes.body.item.productId).toBe(upsellShoeId);
      expect(actionRes.body.item.price).toBe(recommendation.price);
    });
  });

  describe('5. Safety Boundaries Verification', () => {
    it('NEVER creates orders, modifies database inventory, or triggers payments during explainable recommendation generation', async () => {
      const orderCreateSpy = jest.spyOn(Order, 'create');

      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Superior performance.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(res.body).not.toHaveProperty('orderId');
      expect(res.body).not.toHaveProperty('razorpayOrderId');
      expect(res.body).not.toHaveProperty('paymentStatus');
    });
  });
});
