import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import agentRouter from '../src/routes/agent';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { ConversationCartService } from '../src/services/conversationCartService';

describe('Step 3 — Safe, Bounded, User-Approved Cart Actions', () => {
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

  const activeProductId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
  const inactiveProductId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');
  const outOfStockProductId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439033');
  const limitedStockProductId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439044');

  const mockDbProducts: Record<string, any> = {
    [activeProductId.toString()]: {
      _id: activeProductId,
      name: 'Authoritative Pro Running Shoes',
      category: 'Shoes',
      price: 3499,
      currency: 'INR',
      stock: 20,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [inactiveProductId.toString()]: {
      _id: inactiveProductId,
      name: 'Discontinued Vintage Sneakers',
      category: 'Shoes',
      price: 1999,
      currency: 'INR',
      stock: 10,
      isActive: false,
      merchantId: primaryMerchantId,
    },
    [outOfStockProductId.toString()]: {
      _id: outOfStockProductId,
      name: 'Sold Out Marathon Racer',
      category: 'Shoes',
      price: 4999,
      currency: 'INR',
      stock: 0,
      isActive: true,
      merchantId: primaryMerchantId,
    },
    [limitedStockProductId.toString()]: {
      _id: limitedStockProductId,
      name: 'Limited Edition Trail Runner',
      category: 'Shoes',
      price: 2799,
      currency: 'INR',
      stock: 3,
      isActive: true,
      merchantId: primaryMerchantId,
    },
  };

  beforeEach(() => {
    ConversationCartService.clearCart(customerUserId);
    jest.restoreAllMocks();

    // Mock Product.findById to return controlled authoritative records
    jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const found = mockDbProducts[idStr];
      return Promise.resolve(found ? { ...found } : null) as any;
    });
  });

  describe('1. Authentication Enforcement', () => {
    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .send({ productId: activeProductId.toString(), quantity: 1 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects requests with invalid / tampered token with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', 'Bearer invalid.tampered.token')
        .send({ productId: activeProductId.toString(), quantity: 1 });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('2. Explicit User Approval Requirement', () => {
    it('rejects actions when user has explicitly disapproved (userApproved: false)', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: activeProductId.toString(),
          quantity: 1,
          userApproved: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ACTION_NOT_APPROVED');
    });
  });

  describe('3. Product Existence and Active Status Validation', () => {
    it('rejects malformed product IDs with 400 INVALID_REQUEST', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: 'invalid-id-not-objectid', quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_REQUEST');
    });

    it('rejects non-existent product IDs with 404 PRODUCT_NOT_FOUND', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: nonExistentId, quantity: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('rejects inactive products with 400 PRODUCT_INACTIVE', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: inactiveProductId.toString(), quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PRODUCT_INACTIVE');
    });
  });

  describe('4. Merchant Ownership Verification', () => {
    it('rejects products belonging to a different merchant store with 403 MERCHANT_MISMATCH', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${otherMerchantCustomerToken}`)
        .send({ productId: activeProductId.toString(), quantity: 1 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MERCHANT_MISMATCH');
    });
  });

  describe('5. Inventory and Stock Checks', () => {
    it('rejects out-of-stock products (stock: 0) with 400 OUT_OF_STOCK', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: outOfStockProductId.toString(), quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUT_OF_STOCK');
    });

    it('rejects requested quantity exceeding available inventory with 400 OUT_OF_STOCK', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: limitedStockProductId.toString(), quantity: 5 }); // Available: 3

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUT_OF_STOCK');
    });

    it('rejects cumulative additions that exceed available inventory', async () => {
      // First addition: 2 items (out of 3 available) -> succeeds
      const firstRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: limitedStockProductId.toString(), quantity: 2 });

      expect(firstRes.status).toBe(200);

      // Second addition: 2 more items (total 4 > 3 available) -> rejected
      const secondRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: limitedStockProductId.toString(), quantity: 2 });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error.code).toBe('OUT_OF_STOCK');
    });
  });

  describe('6. Quantity Bounds Enforcement', () => {
    it('rejects non-positive quantities (<= 0) with 400 INVALID_QUANTITY', async () => {
      const resZero = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: activeProductId.toString(), quantity: 0 });

      expect(resZero.status).toBe(400);
      expect(resZero.body.error.code).toBe('INVALID_QUANTITY');

      const resNegative = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: activeProductId.toString(), quantity: -3 });

      expect(resNegative.status).toBe(400);
      expect(resNegative.body.error.code).toBe('INVALID_QUANTITY');
    });

    it('rejects non-integer quantities with 400 INVALID_QUANTITY', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: activeProductId.toString(), quantity: 1.5 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUANTITY');
    });

    it('rejects excessive quantities (> 100) with 400 INVALID_QUANTITY', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: activeProductId.toString(), quantity: 101 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUANTITY');
    });
  });

  describe('7. Authoritative Catalog Grounding (Never Trust AI or Client)', () => {
    it('ignores client-supplied price, name, currency, and availability, enforcing database truth', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: activeProductId.toString(),
          quantity: 2,
          // Client attempts to spoof name, price, and currency:
          name: 'Free Spoofed Shoes',
          price: 1,
          currency: 'USD',
          available: false,
          recommendationType: 'UPSELL',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.approved).toBe(true);

      // Must strictly use database truth, not client payload
      expect(res.body.item.name).toBe('Authoritative Pro Running Shoes');
      expect(res.body.item.price).toBe(3499);
      expect(res.body.item.currency).toBe('INR');
      expect(res.body.item.quantity).toBe(2);
      expect(res.body.item.lineTotal).toBe(3499 * 2);

      // Cart subtotal must match authoritative calculation
      expect(res.body.cart.subtotal).toBe(3499 * 2);
      expect(res.body.cart.totalItems).toBe(2);
    });
  });

  describe('8. Safety Boundaries Verification', () => {
    it('NEVER creates orders, deducts database inventory, or invokes payment gateways during add-to-cart', async () => {
      const orderCreateSpy = jest.spyOn(Order, 'create');
      const stockBefore = mockDbProducts[activeProductId.toString()].stock;

      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: activeProductId.toString(), quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 1. No order created
      expect(orderCreateSpy).not.toHaveBeenCalled();

      // 2. Database inventory remains untouched (only decremented at paid checkout)
      expect(mockDbProducts[activeProductId.toString()].stock).toBe(stockBefore);

      // 3. Response contains cart, not order/payment
      expect(res.body).not.toHaveProperty('orderId');
      expect(res.body).not.toHaveProperty('razorpayOrderId');
      expect(res.body).not.toHaveProperty('paymentStatus');
    });
  });
});
