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
import { setAiProvider } from '../src/services/agentRevenueRecommendationService';

describe('Step 7 — Safe, Controlled, Machine-Readable APIs for AI Buyers', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter);
  app.use(errorHandler);

  const primaryMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');
  const otherMerchantId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439099');
  const customerUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013').toString();

  const customerToken = jwt.sign(
    {
      userId: customerUserId,
      email: 'buyer@agent.com',
      role: 'customer',
      merchantId: primaryMerchantId.toString(),
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const shoe1Id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const shoe2Id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014').toString();
  const inactiveId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022').toString();
  const outOfStockId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439033').toString();
  const otherMerchantShoeId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439055').toString();

  const mockDbProducts: Record<string, any> = {
    [shoe1Id]: {
      _id: new mongoose.Types.ObjectId(shoe1Id),
      name: 'Velocity Aero Trainer',
      description: 'Ultra-light responsive road trainer',
      category: 'Running Shoes',
      price: 2499,
      currency: 'INR',
      stock: 15,
      isActive: true,
      merchantId: primaryMerchantId,
      features: ['Lightweight', 'Aero foam'],
      tags: ['road', 'tempo'],
      sku: 'AERO-01',
      relatedProducts: [],
    },
    [shoe2Id]: {
      _id: new mongoose.Types.ObjectId(shoe2Id),
      name: 'Velocity Carbon Plate Racer',
      description: 'Elite racing shoe with full carbon plate',
      category: 'Running Shoes',
      price: 5499,
      currency: 'INR',
      stock: 4, // Low stock <= 5
      isActive: true,
      merchantId: primaryMerchantId,
      features: ['Carbon plate', 'Pebax foam'],
      tags: ['marathon', 'race'],
      sku: 'CARB-02',
      relatedProducts: [],
    },
    [inactiveId]: {
      _id: new mongoose.Types.ObjectId(inactiveId),
      name: 'Archived Legacy Shoe',
      description: 'Discontinued product line',
      category: 'Running Shoes',
      price: 1999,
      currency: 'INR',
      stock: 5,
      isActive: false,
      merchantId: primaryMerchantId,
      features: [],
      tags: [],
      sku: 'LEGACY-00',
      relatedProducts: [],
    },
    [outOfStockId]: {
      _id: new mongoose.Types.ObjectId(outOfStockId),
      name: 'Limited Edition Olympic Colorway',
      description: 'Sold out collector item',
      category: 'Running Shoes',
      price: 6999,
      currency: 'INR',
      stock: 0,
      isActive: true,
      merchantId: primaryMerchantId,
      features: [],
      tags: [],
      sku: 'OLYMPIC-99',
      relatedProducts: [],
    },
    [otherMerchantShoeId]: {
      _id: new mongoose.Types.ObjectId(otherMerchantShoeId),
      name: 'Competitor Speedster',
      description: 'Rival store running footwear',
      category: 'Running Shoes',
      price: 2999,
      currency: 'INR',
      stock: 10,
      isActive: true,
      merchantId: otherMerchantId,
      features: [],
      tags: [],
      sku: 'RIVAL-01',
      relatedProducts: [],
    },
  };

  const sampleAICatalog = Object.values(mockDbProducts)
    .filter((p) => p.isActive)
    .map((p) => ({
      id: p._id.toString(),
      productId: p._id.toString(),
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      currency: p.currency,
      available: p.stock > 0,
      availability: p.stock <= 0 ? 'OUT_OF_STOCK' : p.stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
      inventory: p.stock,
      inventoryStatus: p.stock <= 0 ? 'OUT_OF_STOCK' : p.stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
      features: p.features,
      tags: p.tags,
      sku: p.sku,
      merchantId: p.merchantId.toString(),
      active: p.isActive,
      isActive: p.isActive,
      relatedProducts: [],
    }));

  let orderCreateSpy: jest.SpyInstance;
  let paymentInitSpy: jest.SpyInstance;
  let auditLogSpy: jest.SpyInstance;

  beforeEach(() => {
    ConversationCartService.clearCart(customerUserId);
    jest.restoreAllMocks();

    orderCreateSpy = jest.spyOn(Order, 'create').mockImplementation(() => {
      throw new Error('Order.create should NEVER be invoked in AI-buyer discovery/cart actions');
    });

    paymentInitSpy = jest.spyOn(PaymentService, 'createRazorpayOrder').mockImplementation(() => {
      throw new Error('PaymentService should NEVER be invoked in AI-buyer discovery/cart actions');
    });

    auditLogSpy = jest.spyOn(AuditService, 'log').mockResolvedValue(null as any);
    jest.spyOn(AuditService, 'logActionApproved').mockResolvedValue(null as any);
    jest.spyOn(AuditService, 'logActionFailed').mockResolvedValue(null as any);
    jest.spyOn(AuditService, 'logActionRejected').mockResolvedValue(null as any);
    jest.spyOn(AuditService, 'logRecommendationGenerated').mockResolvedValue(null as any);
    jest.spyOn(AuditService, 'logRecommendationRejected').mockResolvedValue(null as any);

    jest.spyOn(ProductService, 'getAICatalog').mockImplementation(async (mId?: string) => {
      if (mId) {
        return sampleAICatalog.filter((p) => p.merchantId === mId.toString()) as any;
      }
      return sampleAICatalog as any;
    });

    jest.spyOn(ProductService, 'getProductById').mockImplementation(async (id: string) => {
      const p = mockDbProducts[id];
      if (!p) return null as any;
      return {
        ...p,
        save: jest.fn().mockResolvedValue(p),
      } as any;
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

  describe('1. AI-Buyer Catalog Discovery (GET /api/agent/catalog)', () => {
    it('returns a stable, machine-readable catalog with authoritative product facts', async () => {
      const res = await request(app)
        .get('/api/agent/catalog')
        .query({ merchantId: primaryMerchantId.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.schemaVersion).toBe('1.0');
      expect(res.body.currency).toBe('INR');
      expect(typeof res.body.count).toBe('number');
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);

      const item = res.body.products.find((p: any) => p.productId === shoe1Id);
      expect(item).toBeDefined();
      expect(item.name).toBe('Velocity Aero Trainer');
      expect(item.price).toBe(2499);
      expect(item.currency).toBe('INR');
      expect(item.available).toBe(true);
      expect(item.availability).toBe('IN_STOCK');
      expect(item.inventory).toBe(15);
      expect(item.inventoryStatus).toBe('IN_STOCK');
      expect(item.merchantId).toBe(primaryMerchantId.toString());

      // Audit logged
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AI_CATALOG_SEARCH',
          status: 'success',
        })
      );
    });

    it('enforces merchant store isolation when merchantId is provided', async () => {
      const res = await request(app)
        .get('/api/agent/catalog')
        .query({ merchantId: primaryMerchantId.toString() });

      expect(res.status).toBe(200);
      const otherStoreItem = res.body.products.find(
        (p: any) => p.merchantId === otherMerchantId.toString()
      );
      expect(otherStoreItem).toBeUndefined();
    });

    it('rejects malformed merchantId with 400 INVALID_REQUEST', async () => {
      const res = await request(app)
        .get('/api/agent/catalog')
        .query({ merchantId: 'not-a-valid-object-id' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_REQUEST');
    });

    it('supports machine-readable filters (minPrice, maxPrice, inStockOnly)', async () => {
      const res = await request(app)
        .get('/api/agent/catalog')
        .query({
          merchantId: primaryMerchantId.toString(),
          minPrice: 5000,
          inStockOnly: 'true',
        });

      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(5000);
        expect(p.available).toBe(true);
      });
    });
  });

  describe('2. Real-Time Product Fact Inspection (GET /api/agent/products/:id)', () => {
    it('returns real-time authoritative product facts for AI buyers', async () => {
      const res = await request(app).get(`/api/agent/products/${shoe1Id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.productId).toBe(shoe1Id);
      expect(res.body.product.price).toBe(2499);
      expect(res.body.product.currency).toBe('INR');
      expect(res.body.product.available).toBe(true);
      expect(res.body.product.inventory).toBe(15);
      expect(res.body.product.inventoryStatus).toBe('IN_STOCK');
      expect(res.body.product.merchantId).toBe(primaryMerchantId.toString());

      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AI_PRODUCT_SELECTED',
          entityId: shoe1Id,
          status: 'success',
        })
      );
    });

    it('rejects invalid product ID format with 400 PRODUCT_NOT_FOUND', async () => {
      const res = await request(app).get('/api/agent/products/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('rejects inactive or non-existent products with 404 PRODUCT_NOT_FOUND', async () => {
      const res = await request(app).get(`/api/agent/products/${inactiveId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('enforces merchant store alignment on product inspection', async () => {
      const res = await request(app)
        .get(`/api/agent/products/${shoe1Id}`)
        .set('x-merchant-id', otherMerchantId.toString());

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MERCHANT_MISMATCH');
    });
  });

  describe('3. Grounded Recommendations Access (POST /api/agent/recommendations)', () => {
    it('rejects unauthenticated AI buyer recommendation requests with 401', async () => {
      const res = await request(app)
        .post('/api/agent/recommendations')
        .send({ cartItems: [{ productId: shoe1Id, quantity: 1 }] });

      expect(res.status).toBe(401);
    });

    it('returns grounded recommendations with complete explainability fields for authenticated AI buyer', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: shoe2Id,
          reason: 'Upgrade to carbon-plated marathon performance.',
        },
      ]);

      const res = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cartItems: [{ productId: shoe1Id, quantity: 1 }] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recommendations).toHaveLength(1);

      const rec = res.body.recommendations[0];
      expect(rec.productId).toBe(shoe2Id);
      expect(rec.productName).toBe('Velocity Carbon Plate Racer');
      expect(rec.price).toBe(5499); // Authoritative DB price
      expect(rec.currentCartTotal).toBe(2499);
      expect(rec.quantityAdded).toBe(1);
      expect(rec.newCartTotal).toBe(7998); // 2499 + 5499
      expect(rec.available).toBe(true);
      expect(typeof rec.explanation).toBe('string');
    });
  });

  describe('4. Explicitly Approved Bounded Cart Action (POST /api/agent/actions/add-to-cart)', () => {
    it('rejects unapproved cart additions (userApproved: false) with 400 ACTION_NOT_APPROVED', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: shoe1Id,
          quantity: 1,
          userApproved: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ACTION_NOT_APPROVED');

      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
    });

    it('executes user-approved cart addition with authoritative pricing and inventory validation', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: shoe1Id,
          quantity: 2,
          price: 10, // AI/client attempt to supply price is completely ignored
          userApproved: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.action).toBe('ADD_TO_CART');
      expect(res.body.approved).toBe(true);
      expect(res.body.item.price).toBe(2499); // Authoritative price enforced
      expect(res.body.item.lineTotal).toBe(4998);

      const cart = ConversationCartService.getCart(customerUserId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].price).toBe(2499);
    });

    it('rejects out-of-stock products with 400 OUT_OF_STOCK and leaves cart unchanged', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: outOfStockId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OUT_OF_STOCK');
      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
    });

    it('rejects cross-merchant products with 403 MERCHANT_MISMATCH and leaves cart unchanged', async () => {
      const res = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: otherMerchantShoeId,
          quantity: 1,
          userApproved: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('MERCHANT_MISMATCH');
      expect(ConversationCartService.getCart(customerUserId).items).toEqual([]);
    });
  });

  describe('5. Safety Boundaries & Side-Effect Invariance', () => {
    it('NEVER creates orders, deducts inventory, or invokes Razorpay during AI-buyer flows', async () => {
      // 1. Catalog discovery
      await request(app).get('/api/agent/catalog');

      // 2. Product selection
      await request(app).get(`/api/agent/products/${shoe1Id}`);

      // 3. Recommendation access
      setAiProvider(async () => [{ type: 'UPSELL', productId: shoe2Id, reason: 'Upgrade' }]);
      await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cartItems: [{ productId: shoe1Id, quantity: 1 }] });

      // 4. Approved cart addition
      await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: shoe1Id,
          quantity: 1,
          userApproved: true,
        });

      // Strict assertions: No financial or database order side effects
      expect(orderCreateSpy).not.toHaveBeenCalled();
      expect(paymentInitSpy).not.toHaveBeenCalled();
    });
  });
});
