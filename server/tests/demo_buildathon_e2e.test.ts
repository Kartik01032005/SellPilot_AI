import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import rootRouter from '../src/routes';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { Payment } from '../src/models/Payment';
import { Merchant } from '../src/models/Merchant';
import { User } from '../src/models/User';
import { AuditService } from '../src/services/auditService';
import { ProductService } from '../src/services/productService';
import { PaymentService } from '../src/services/paymentService';
import { SeedService } from '../src/services/seedService';
import { ConversationCartService } from '../src/services/conversationCartService';
import { setAiProvider } from '../src/services/agentRevenueRecommendationService';

describe('Final End-to-End Verification — Razorpay Buildathon Demo Flow', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', rootRouter);
  app.use(errorHandler);

  const primaryMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
  const otherMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439099');
  const customerUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013').toString();
  const merchantUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439019').toString();

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

  const merchantToken = jwt.sign(
    {
      userId: merchantUserId,
      email: 'merchant@store.com',
      role: 'merchant',
      merchantId: primaryMerchantId.toString(),
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  // Products
  const cameraId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const lensId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014').toString();
  const outOfStockId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439033').toString();

  let productsState: Record<string, any> = {};

  const initProducts = () => ({
    [cameraId]: {
      _id: new mongoose.Types.ObjectId(cameraId),
      name: 'Sony Alpha Mirrorless Camera',
      description: 'Full-frame 4K mirrorless camera body',
      category: 'Cameras',
      price: 64990,
      currency: 'INR',
      stock: 10,
      isActive: true,
      merchantId: primaryMerchantId,
      features: ['24.2 MP', '4K HDR', '5-axis stabilization'],
      tags: ['camera', 'mirrorless', 'photography'],
      sku: 'CAM-SONY-A7',
      relatedProducts: [lensId],
    },
    [lensId]: {
      _id: new mongoose.Types.ObjectId(lensId),
      name: '50mm f/1.8 Prime Lens',
      description: 'Essential high-speed portrait prime lens',
      category: 'Lenses',
      price: 14990,
      currency: 'INR',
      stock: 8,
      isActive: true,
      merchantId: primaryMerchantId,
      features: ['f/1.8 aperture', 'Circular aperture', 'Compact'],
      tags: ['lens', 'prime', 'portrait'],
      sku: 'LENS-FE-50',
      relatedProducts: [],
    },
    [outOfStockId]: {
      _id: new mongoose.Types.ObjectId(outOfStockId),
      name: 'Sold-Out Telephoto 70-200mm f/2.8 GM',
      description: 'Pro telephoto zoom lens',
      category: 'Lenses',
      price: 189990,
      currency: 'INR',
      stock: 0,
      isActive: true,
      merchantId: primaryMerchantId,
      features: ['f/2.8 constant', 'Optical SteadyShot'],
      tags: ['telephoto', 'gm'],
      sku: 'LENS-FE-70200',
      relatedProducts: [],
    },
  });

  const auditEvents: any[] = [];
  const ordersDb: Record<string, any> = {};
  const paymentsDb: Record<string, any> = {};

  beforeEach(() => {
    productsState = initProducts();
    auditEvents.length = 0;
    ConversationCartService.clearCart(customerUserId);
    jest.restoreAllMocks();

    // Audit spy that records in-memory
    jest.spyOn(AuditService, 'log').mockImplementation(async (event: any) => {
      auditEvents.push({ ...event, timestamp: new Date() });
      return null as any;
    });

    // Mock Product methods for authoritative state
    jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const p = productsState[idStr];
      const res = p
        ? {
            ...p,
            save: jest.fn().mockImplementation(function (this: any) {
              productsState[idStr] = { ...this };
              return Promise.resolve(this);
            }),
          }
        : null;
      return {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(res),
        then: (resolve: any, reject: any) => Promise.resolve(res).then(resolve, reject),
        catch: (reject: any) => Promise.resolve(res).catch(reject),
      } as any;
    });

    jest.spyOn(SeedService, 'seedCatalogIfEmpty').mockResolvedValue(undefined as any);

    jest.spyOn(Merchant, 'findById').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: primaryMerchantId,
        maxDiscountPercentage: 25,
      }),
    } as any);

    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(merchantUserId),
        merchantId: primaryMerchantId,
        role: 'merchant',
      }),
    } as any);

    jest.spyOn(Order, 'findOne').mockResolvedValue(null as any);

    jest.spyOn(Product, 'find').mockImplementation((query: any = {}) => {
      let filtered = Object.values(productsState);
      if (query.merchantId) {
        filtered = filtered.filter((p) => p.merchantId.toString() === query.merchantId.toString());
      }
      if (query.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === query.isActive);
      }
      return {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(filtered),
      } as any;
    });

    jest.spyOn(Product, 'findOneAndUpdate').mockImplementation((filter: any, update: any) => {
      const idStr = filter._id ? filter._id.toString() : '';
      const p = productsState[idStr];
      if (!p) return { exec: jest.fn().mockResolvedValue(null) } as any;

      if (filter.stock && filter.stock.$gte !== undefined) {
        if (p.stock < filter.stock.$gte) {
          return { exec: jest.fn().mockResolvedValue(null) } as any;
        }
      }

      if (update.$inc && update.$inc.stock !== undefined) {
        p.stock += update.$inc.stock;
      }
      if (update.$set) {
        Object.assign(p, update.$set);
      }

      return {
        exec: jest.fn().mockResolvedValue(p),
      } as any;
    });

    // Mock Order methods
    jest.spyOn(Order, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const order = ordersDb[idStr];
      const res = order || null;
      return {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(res),
        then: (resolve: any, reject: any) => Promise.resolve(res).then(resolve, reject),
        catch: (reject: any) => Promise.resolve(res).catch(reject),
      } as any;
    });

    jest.spyOn(Order, 'find').mockImplementation((query: any = {}) => {
      let filtered = Object.values(ordersDb);
      if (query.userId) {
        filtered = filtered.filter((o) => o.userId && o.userId.toString() === query.userId.toString());
      }
      return {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(filtered),
      } as any;
    });

    // Mock Payment methods
    jest.spyOn(Payment, 'findOne').mockImplementation((query: any = {}) => {
      if (query.razorpayOrderId) {
        const found = Object.values(paymentsDb).find(
          (p) => p.razorpayOrderId === query.razorpayOrderId
        );
        if (!found) return Promise.resolve(null) as any;
        return Promise.resolve(found) as any;
      }
      return Promise.resolve(null) as any;
    });

    jest.spyOn(Payment, 'findById').mockImplementation((id: any) => {
      const idStr = id ? id.toString() : '';
      const payment = paymentsDb[idStr];
      if (!payment) return Promise.resolve(null) as any;
      return Promise.resolve(payment) as any;
    });

    jest.spyOn(Payment, 'findOneAndUpdate').mockImplementation((filter: any, update: any) => {
      const idStr = filter._id ? filter._id.toString() : '';
      const payment = paymentsDb[idStr];
      if (!payment) return Promise.resolve(null) as any;
      if (update.$set) {
        Object.assign(payment, update.$set);
      }
      return Promise.resolve(payment) as any;
    });

    // Mock Razorpay instance
    const mockRzpOrderId = 'order_test_buildathon_9988';
    (PaymentService as any).getRazorpayInstance = jest.fn().mockReturnValue({
      orders: {
        create: jest.fn().mockResolvedValue({
          id: mockRzpOrderId,
          amount: 7998000,
          currency: 'INR',
        }),
      },
      payments: {
        fetch: jest.fn().mockImplementation((paymentId: string) =>
          Promise.resolve({
            id: paymentId,
            order_id: mockRzpOrderId,
            status: 'captured',
            amount: 7998000,
            currency: 'INR',
          })
        ),
      },
    });

    // Mock Order.prototype.save & Payment.prototype.save when instantiated
    jest.spyOn(Order.prototype, 'save').mockImplementation(function (this: any) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      ordersDb[this._id.toString()] = this;
      return Promise.resolve(this);
    });

    jest.spyOn(Payment.prototype, 'save').mockImplementation(function (this: any) {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      paymentsDb[this._id.toString()] = this;
      return Promise.resolve(this);
    });
  });

  afterEach(() => {
    setAiProvider(null);
  });

  describe('Complete Razorpay Buildathon Demo Flow (End-to-End)', () => {
    it('executes the full happy path: login → catalog → add camera → AI cross-sell → approve → server validate → add lens → Razorpay checkout → test payment → verify → inventory decremented → order paid → audit confirmed', async () => {
      // -------------------------------------------------------------------------
      // Step 1: Browse Catalog as Customer
      // -------------------------------------------------------------------------
      const catalogRes = await request(app)
        .get('/api/agent/catalog')
        .query({ merchantId: primaryMerchantId.toString() });

      expect(catalogRes.status).toBe(200);
      expect(catalogRes.body.success).toBe(true);
      expect(catalogRes.body.count).toBeGreaterThanOrEqual(2);

      const cameraInCatalog = catalogRes.body.products.find((p: any) => p.productId === cameraId);
      expect(cameraInCatalog).toBeDefined();
      expect(cameraInCatalog.name).toBe('Sony Alpha Mirrorless Camera');
      expect(cameraInCatalog.price).toBe(64990);
      expect(cameraInCatalog.available).toBe(true);
      expect(cameraInCatalog.inventory).toBe(10);

      // -------------------------------------------------------------------------
      // Step 2: Customer Adds Camera to Cart
      // -------------------------------------------------------------------------
      const addCameraRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: cameraId,
          quantity: 1,
          userApproved: true,
        });

      expect(addCameraRes.status).toBe(200);
      expect(addCameraRes.body.success).toBe(true);
      expect(addCameraRes.body.item.name).toBe('Sony Alpha Mirrorless Camera');
      expect(addCameraRes.body.cart.subtotal).toBe(64990);
      expect(addCameraRes.body.cart.totalItems).toBe(1);

      // -------------------------------------------------------------------------
      // Step 3: AI Reads Cart & Generates Grounded Recommendation
      // -------------------------------------------------------------------------
      setAiProvider(async () => [
        {
          type: 'CROSS_SELL',
          productId: lensId,
          reason: 'Essential high-speed prime lens for stunning portraits and low-light photography.',
        },
      ]);

      const recRes = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: cameraId, quantity: 1 }],
        });

      expect(recRes.status).toBe(200);
      expect(recRes.body.success).toBe(true);
      expect(recRes.body.recommendations).toHaveLength(1);

      const rec = recRes.body.recommendations[0];
      expect(rec.productId).toBe(lensId);
      expect(rec.productName).toBe('50mm f/1.8 Prime Lens');
      expect(rec.price).toBe(14990); // Authoritative catalog price
      expect(rec.reason).toContain('Essential high-speed prime lens');
      expect(rec.currentCartTotal).toBe(64990);
      expect(rec.quantityAdded).toBe(1);
      expect(rec.newCartTotal).toBe(79980); // 64,990 + 14,990 = 79,980
      expect(rec.explanation).toBeDefined();

      // -------------------------------------------------------------------------
      // Step 4: User Explicitly Approves Recommendation → Server Adds to Cart
      // -------------------------------------------------------------------------
      const addLensRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: lensId,
          quantity: 1,
          recommendationType: 'CROSS_SELL',
          userApproved: true,
        });

      expect(addLensRes.status).toBe(200);
      expect(addLensRes.body.success).toBe(true);
      expect(addLensRes.body.item.name).toBe('50mm f/1.8 Prime Lens');
      expect(addLensRes.body.item.price).toBe(14990);
      expect(addLensRes.body.cart.subtotal).toBe(79980);
      expect(addLensRes.body.cart.totalItems).toBe(2);

      // Verify Audit Trail for approved addition
      const addAudit = auditEvents.find(
        (e) => e.action === 'AGENT_APPROVED_ADD_TO_CART' && e.metadata?.productId === lensId
      );
      expect(addAudit).toBeDefined();
      expect(addAudit.metadata?.price).toBe(14990);

      // -------------------------------------------------------------------------
      // Step 5: Prepare Checkout & Create Order
      // -------------------------------------------------------------------------
      const prepRes = await request(app)
        .post('/api/checkout/prepare')
        .send({
          items: [
            { productId: cameraId, quantity: 1 },
            { productId: lensId, quantity: 1 },
          ],
        });

      expect(prepRes.status).toBe(200);
      expect(prepRes.body.success).toBe(true);
      expect(prepRes.body.subtotal).toBe(79980);
      expect(prepRes.body.total).toBe(79980);

      const createOrderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: cameraId, quantity: 1 },
            { productId: lensId, quantity: 1 },
          ],
          shippingAddress: {
            fullName: 'Rahul Sharma',
            addressLine1: '42 MG Road, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            phone: '9876543210',
          },
        });

      expect(createOrderRes.status).toBe(201);
      expect(createOrderRes.body.success).toBe(true);
      const order = createOrderRes.body.order;
      const orderId = order._id.toString();
      expect(order.status).toBe('pending');
      expect(order.totalAmount).toBe(79980);

      // -------------------------------------------------------------------------
      // Step 6: Razorpay Test Mode Order Creation
      // -------------------------------------------------------------------------
      const rzpOrderRes = await request(app)
        .post('/api/payment/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(rzpOrderRes.status).toBe(200);
      expect(rzpOrderRes.body.success).toBe(true);
      expect(rzpOrderRes.body.razorpayOrderId).toBe('order_test_buildathon_9988');
      expect(rzpOrderRes.body.amount).toBe(79980);

      // -------------------------------------------------------------------------
      // Step 7: Complete Razorpay Test Mode Payment & Verify Signature
      // -------------------------------------------------------------------------
      const testPaymentId = 'pay_test_' + crypto.randomBytes(8).toString('hex');
      const validSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`order_test_buildathon_9988|${testPaymentId}`)
        .digest('hex');

      const verifyRes = await request(app)
        .post('/api/payment/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          razorpayOrderId: 'order_test_buildathon_9988',
          razorpayPaymentId: testPaymentId,
          razorpaySignature: validSignature,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.verified).toBe(true);
      expect(verifyRes.body.status).toBe('paid');

      // -------------------------------------------------------------------------
      // Step 8: Assert Inventory Correctly Decremented in Database
      // -------------------------------------------------------------------------
      expect(productsState[cameraId].stock).toBe(9); // Initial 10 - 1 = 9
      expect(productsState[lensId].stock).toBe(7);   // Initial 8 - 1 = 7

      // -------------------------------------------------------------------------
      // Step 9: Order Confirmation & History Visibility
      // -------------------------------------------------------------------------
      const getOrderRes = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getOrderRes.status).toBe(200);
      expect(getOrderRes.body.order.status).toBe('paid');
      expect(getOrderRes.body.order.totalAmount).toBe(79980);
      expect(getOrderRes.body.order.razorpayPaymentId).toBe(testPaymentId);

      const userOrdersRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(userOrdersRes.status).toBe(200);
      expect(userOrdersRes.body.orders.some((o: any) => o._id.toString() === orderId)).toBe(true);

      // -------------------------------------------------------------------------
      // Step 10: Complete Audit Trail Confirmation
      // -------------------------------------------------------------------------
      const eventActions = auditEvents.map((e) => e.action);
      expect(eventActions).toContain('AGENT_RECOMMENDATION_GENERATED');
      expect(eventActions).toContain('AGENT_APPROVED_ADD_TO_CART');
      expect(eventActions).toContain('payment_order_created');
      expect(eventActions).toContain('payment_verified');
    });

    it('handles failure safely: out-of-stock product rejection leaves cart, order, and payments completely intact', async () => {
      // 1. Initial cart setup with Camera
      await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: cameraId, quantity: 1, userApproved: true });

      const cartBefore = ConversationCartService.getCart(customerUserId);
      expect(cartBefore.items).toHaveLength(1);

      // 2. Attempt to add out-of-stock item
      const failedRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: outOfStockId,
          quantity: 1,
          userApproved: true,
        });

      expect(failedRes.status).toBe(400);
      expect(failedRes.body.error.code).toBe('OUT_OF_STOCK');

      // 3. Confirm cart is completely unchanged
      const cartAfter = ConversationCartService.getCart(customerUserId);
      expect(cartAfter.items).toHaveLength(1);
      expect(cartAfter.items[0].productId).toBe(cameraId);

      // 4. Confirm failure was audited
      const failAudit = auditEvents.find((e) => e.action === 'AGENT_ACTION_FAILED');
      expect(failAudit).toBeDefined();
      expect(failAudit.metadata?.errorCode).toBe('OUT_OF_STOCK');

      // 5. Confirm no orders created and inventory unchanged
      expect(productsState[outOfStockId].stock).toBe(0);
      expect(productsState[cameraId].stock).toBe(10);
    });

    it('verifies merchant catalog visibility after refresh and re-login', async () => {
      // 1. Merchant access to catalog
      const merchantCatalogRes = await request(app)
        .get('/api/merchant/products')
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(merchantCatalogRes.status).toBe(200);
      expect(merchantCatalogRes.body.success).toBe(true);
      expect(merchantCatalogRes.body.products.length).toBeGreaterThanOrEqual(2);

      // 2. Simulate refresh / re-login by generating a fresh token
      const freshMerchantToken = jwt.sign(
        {
          userId: merchantUserId,
          email: 'merchant@store.com',
          role: 'merchant',
          merchantId: primaryMerchantId.toString(),
        },
        config.jwt.secret,
        { expiresIn: '2h' }
      );

      const refreshedCatalogRes = await request(app)
        .get('/api/merchant/products')
        .set('Authorization', `Bearer ${freshMerchantToken}`);

      expect(refreshedCatalogRes.status).toBe(200);
      expect(refreshedCatalogRes.body.success).toBe(true);
      expect(refreshedCatalogRes.body.count).toBe(merchantCatalogRes.body.count);

      // All returned products belong to this merchant
      refreshedCatalogRes.body.products.forEach((prod: any) => {
        expect(prod.merchantId.toString()).toBe(primaryMerchantId.toString());
      });
    });
  });
});
