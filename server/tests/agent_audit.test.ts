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
import { AuditService } from '../src/services/auditService';
import {
  setAiProvider,
} from '../src/services/agentRevenueRecommendationService';

describe('Step 5 — Reliable AI Agent Audit Trail for Revenue Agent Flow', () => {
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
  const upsellShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014').toString();
  const outOfStockId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439015').toString();

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
      stock: 20,
      features: ['Cushioning'],
      tags: ['running'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [upsellShoeId],
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
      stock: 10,
      features: ['Carbon plate'],
      tags: ['racing'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [baseShoeId],
    },
    {
      id: outOfStockId,
      productId: outOfStockId,
      name: 'Sold Out Model',
      category: 'Shoes',
      price: 3000,
      currency: 'INR',
      available: false,
      availability: 'OUT_OF_STOCK',
      inventory: 0,
      stock: 0,
      features: [],
      tags: [],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [],
    },
  ];

  let auditLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    auditLogSpy = jest.spyOn(AuditService, 'log').mockResolvedValue(null);
    jest.spyOn(ProductService, 'getAICatalog').mockResolvedValue(sampleCatalog as any);

    jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const found = sampleCatalog.find((p) => p.productId === idStr);
      return Promise.resolve(found ? { ...found, _id: new mongoose.Types.ObjectId(found.productId) } : null) as any;
    });
  });

  afterEach(() => {
    setAiProvider(null);
  });

  describe('1. Recommendation Events Audit Trail', () => {
    it('records AGENT_RECOMMENDATION_GENERATED upon successful recommendation generation', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Premium marathon racer upgrade.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AGENT_RECOMMENDATION_GENERATED',
          eventType: 'RECOMMENDATION_GENERATED',
          actorType: 'buyer_agent',
          status: 'success',
          userId: customerUserId,
          merchantId,
          metadata: expect.objectContaining({
            recommendationsCount: 1,
            productIds: [upsellShoeId],
            recommendationTypes: ['UPSELL'],
            currentCartTotal: 2000,
          }),
        })
      );
    });

    it('records AGENT_RECOMMENDATION_REJECTED when recommendations cannot be generated', async () => {
      // Send cart with non-existent item
      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);

      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AGENT_RECOMMENDATION_REJECTED',
          eventType: 'RECOMMENDATION_REJECTED',
          actorType: 'buyer_agent',
          status: 'rejected',
          userId: customerUserId,
          merchantId,
        })
      );
    });
  });

  describe('2. User Action Approval and Rejection Events', () => {
    it('records AGENT_ACTION_REJECTED with USER_DISAPPROVAL when user disapproves an action', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: upsellShoeId,
          quantity: 1,
          userApproved: false,
        });

      expect(res.status).toBe(400);
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AGENT_ACTION_REJECTED',
          eventType: 'USER_DISAPPROVAL',
          actorType: 'buyer',
          status: 'rejected',
          userId: customerUserId,
          metadata: expect.objectContaining({
            productId: upsellShoeId,
            reason: 'USER_DISAPPROVAL',
          }),
        })
      );
    });

    it('records AGENT_APPROVED_ADD_TO_CART with CART_ACTION_APPROVED on successful addition', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: upsellShoeId,
          quantity: 2,
          userApproved: true,
        });

      expect(res.status).toBe(200);
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AGENT_APPROVED_ADD_TO_CART',
          eventType: 'CART_ACTION_APPROVED',
          actorType: 'buyer',
          status: 'success',
          userId: customerUserId,
          merchantId,
          amount: 4500 * 2,
          metadata: expect.objectContaining({
            productId: upsellShoeId,
            productName: 'Pro Elite Carbon Racer',
            quantity: 2,
            price: 4500,
            subtotal: 9000,
          }),
        })
      );
    });
  });

  describe('3. Action Failure Audit Event', () => {
    it('records AGENT_ACTION_FAILED with failure reason when out of stock', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: outOfStockId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AGENT_ACTION_FAILED',
          eventType: 'CART_ACTION_FAILED',
          status: 'failed',
          userId: customerUserId,
          metadata: expect.objectContaining({
            productId: outOfStockId,
            errorCode: 'OUT_OF_STOCK',
            failureReason: expect.any(String),
          }),
        })
      );
    });
  });

  describe('4. Sensitive Data Sanitization & Protection', () => {
    it('strictly sanitizes and strips API keys, passwords, JWTs, and Razorpay secrets from metadata', () => {
      const dirtyMetadata = {
        productId: upsellShoeId,
        price: 4500,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive',
        jwt: 'secret_jwt_token',
        password: 'PlainPassword123',
        razorpaySecret: 'rzp_test_secret_12345',
        apiKey: 'AIzaSySecretApiKey',
        authorization: 'Bearer secret_token',
        nested: {
          cvv: '123',
          card: '4111222233334444',
          safeField: 'AllowedValue',
        },
      };

      const sanitized = AuditService.sanitizeMetadata(dirtyMetadata);

      // Safe fields are preserved
      expect(sanitized.productId).toBe(upsellShoeId);
      expect(sanitized.price).toBe(4500);
      expect((sanitized.nested as any).safeField).toBe('AllowedValue');

      // Sensitive fields are completely purged
      expect(sanitized).not.toHaveProperty('token');
      expect(sanitized).not.toHaveProperty('jwt');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('razorpaySecret');
      expect(sanitized).not.toHaveProperty('apiKey');
      expect(sanitized).not.toHaveProperty('authorization');
      expect(sanitized.nested).not.toHaveProperty('cvv');
      expect(sanitized.nested).not.toHaveProperty('card');
    });
  });

  describe('5. Audit Trail Server-Generation & Non-Interference', () => {
    it('uses server-authenticated identity and never trusts client-supplied user or merchant spoofing', async () => {
      const attackerFakeUserId = new mongoose.Types.ObjectId().toString();
      const attackerFakeMerchantId = new mongoose.Types.ObjectId().toString();

      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: upsellShoeId,
          reason: 'Race day upgrade.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: baseShoeId, quantity: 1 }],
          // Attacker attempts to spoof user/merchant in body
          userId: attackerFakeUserId,
          merchantId: attackerFakeMerchantId,
        });

      expect(res.status).toBe(200);

      // Log must strictly use server's authenticated token values
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: customerUserId,
          merchantId,
        })
      );
    });

    it('NEVER creates orders or deducts inventory during audit logging', async () => {
      const orderCreateSpy = jest.spyOn(Order, 'create');

      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: upsellShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(200);
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(sampleCatalog.find((p) => p.productId === upsellShoeId)?.stock).toBe(10);
    });
  });
});
