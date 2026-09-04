import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import agentRouter from '../src/routes/agent';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { ProductService } from '../src/services/productService';
import { Product } from '../src/models/Product';
import { ConversationCartService } from '../src/services/conversationCartService';
import {
  AgentRevenueRecommendationService,
  setAiProvider,
} from '../src/services/agentRevenueRecommendationService';

describe('Step 2 — Safe AI Revenue Agent (UPSELL & CROSS_SELL)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter);
  app.use(errorHandler);

  const merchantId = '507f1f77bcf86cd799439012';

  const customerToken = jwt.sign(
    {
      userId: '507f1f77bcf86cd799439013',
      email: 'customer@buyer.com',
      role: 'customer',
      merchantId,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const sampleCatalog = [
    {
      id: '507f1f77bcf86cd799439011',
      productId: '507f1f77bcf86cd799439011',
      name: 'Standard Running Shoes',
      description: 'Comfortable everyday running shoes',
      category: 'Shoes',
      price: 2000,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 15,
      inventoryStatus: 'IN_STOCK',
      features: ['Cushioned sole', 'Breathable mesh'],
      tags: ['running', 'fitness'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: ['507f1f77bcf86cd799439013'],
    },
    {
      id: '507f1f77bcf86cd799439014',
      productId: '507f1f77bcf86cd799439014',
      name: 'Pro Carbon Running Shoes',
      description: 'Elite racing shoe with carbon-fiber plate',
      category: 'Shoes',
      price: 3500,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 8,
      inventoryStatus: 'IN_STOCK',
      features: ['Carbon plate', 'Ultralight foam'],
      tags: ['racing', 'marathon'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: ['507f1f77bcf86cd799439013'],
    },
    {
      id: '507f1f77bcf86cd799439013',
      productId: '507f1f77bcf86cd799439013',
      name: 'Anti-Blister Running Socks (3-Pack)',
      description: 'Seamless running socks with arch support',
      category: 'Accessories',
      price: 499,
      currency: 'INR',
      available: true,
      availability: 'IN_STOCK',
      inventory: 50,
      inventoryStatus: 'IN_STOCK',
      features: ['Moisture-wicking', 'Anti-blister'],
      tags: ['socks', 'accessories'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: ['507f1f77bcf86cd799439011'],
    },
    {
      id: '507f1f77bcf86cd799439015',
      productId: '507f1f77bcf86cd799439015',
      name: 'Gel Support Insoles (Out of Stock)',
      description: 'Shock-absorbing replacement insoles',
      category: 'Accessories',
      price: 699,
      currency: 'INR',
      available: false,
      availability: 'OUT_OF_STOCK',
      inventory: 0,
      inventoryStatus: 'OUT_OF_STOCK',
      features: ['Gel cushioning'],
      tags: ['insoles'],
      merchantId,
      active: true,
      isActive: true,
      relatedProducts: [],
    },
  ];

  let getAICatalogSpy: jest.SpyInstance;

  beforeEach(() => {
    getAICatalogSpy = jest
      .spyOn(ProductService, 'getAICatalog')
      .mockResolvedValue(sampleCatalog as any);
    setAiProvider(null);
  });

  afterEach(() => {
    getAICatalogSpy.mockRestore();
    setAiProvider(null);
  });

  describe('Security & Authentication', () => {
    it('rejects unauthenticated recommendation requests with 401', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects malformed authorization header with 401', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Request Validation & Safety', () => {
    it('returns RECOMMENDATION_UNAVAILABLE when cartItems is empty', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cartItems: [] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('returns RECOMMENDATION_UNAVAILABLE for invalid productId format', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cartItems: [{ productId: 'invalid-not-an-id', quantity: 1 }] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('returns RECOMMENDATION_UNAVAILABLE for non-positive or non-integer quantity', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: -1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('returns RECOMMENDATION_UNAVAILABLE for cart item not present in catalog', async () => {
      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439099', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });
  });

  describe('AI Failure & Error Fallbacks', () => {
    it('returns RECOMMENDATION_UNAVAILABLE when AI provider throws an error or times out', async () => {
      setAiProvider(async () => {
        throw new Error('Gemini API 503 Service Unavailable / Timeout');
      });

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('returns RECOMMENDATION_UNAVAILABLE when AI is unconfigured and returns no suggestions', async () => {
      // Unconfigured AI -> throws AI_SERVICE_NOT_CONFIGURED and fails gracefully
      const origKey = config.ai.apiKey;
      const origProvider = config.ai.provider;
      config.ai.apiKey = '';
      config.ai.provider = '';
      try {
        const response = await request(app)
          .post('/api/agent/recommendations')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: false,
          recommendations: [],
          reason: 'RECOMMENDATION_UNAVAILABLE',
        });
      } finally {
        config.ai.apiKey = origKey;
        config.ai.provider = origProvider;
      }
    });
  });

  describe('Catalog Grounding & Anti-Hallucination Protections', () => {
    it('strictly rejects AI recommendations with hallucinated/non-existent product IDs', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439999', // Non-existent ID invented by AI
          reason: 'Invented super shoes',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('strictly rejects recommending unavailable/out-of-stock products', async () => {
      setAiProvider(async () => [
        {
          type: 'CROSS_SELL',
          productId: '507f1f77bcf86cd799439015', // Out of stock product
          reason: 'Insoles pair great with shoes',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('strictly rejects recommending a product that is already in the cart', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439011', // Already in cart
          reason: 'Buy more of what you already have',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        recommendations: [],
        reason: 'RECOMMENDATION_UNAVAILABLE',
      });
    });

    it('always overrides AI-supplied prices and names with authoritative catalog data', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439014',
          reason: 'Upgrade to carbon plate racing shoe',
          // AI might attempt to inject a fake price or name
          ...({ productName: 'Hallucinated Fake Name', price: 99 } as any),
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toHaveLength(1);

      const rec = response.body.recommendations[0];
      // Price and name MUST come from sampleCatalog (3500 and Pro Carbon Running Shoes)
      expect(rec.productId).toBe('507f1f77bcf86cd799439014');
      expect(rec.productName).toBe('Pro Carbon Running Shoes');
      expect(rec.price).toBe(3500);
      expect(rec.available).toBe(true);
      expect(rec.type).toBe('UPSELL');
    });
  });

  describe('Valid UPSELL & CROSS_SELL Recommendation Generation', () => {
    it('returns grounded UPSELL and CROSS_SELL recommendations matching exact schema', async () => {
      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439014',
          reason: 'Upgrade to elite racing performance with carbon fiber plate',
        },
        {
          type: 'CROSS_SELL',
          productId: '507f1f77bcf86cd799439013',
          reason: 'Anti-blister socks are designed specifically for running shoes',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toHaveLength(2);

      const upsell = response.body.recommendations.find(
        (r: any) => r.type === 'UPSELL'
      );
      expect(upsell).toEqual(
        expect.objectContaining({
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439014',
          productName: 'Pro Carbon Running Shoes',
          price: 3500,
          reason: expect.any(String),
          available: true,
          currentCartTotal: 2000,
          quantityAdded: 1,
          newCartTotal: 5500,
          explanation: expect.any(String),
        })
      );

      const crossSell = response.body.recommendations.find(
        (r: any) => r.type === 'CROSS_SELL'
      );
      expect(crossSell).toEqual(
        expect.objectContaining({
          type: 'CROSS_SELL',
          productId: '507f1f77bcf86cd799439013',
          productName: 'Anti-Blister Running Socks (3-Pack)',
          price: 499,
          reason: expect.any(String),
          available: true,
          currentCartTotal: 2000,
          quantityAdded: 1,
          newCartTotal: 2499,
          explanation: expect.any(String),
        })
      );
    });
  });

  describe('Merchant Scoping & Cross-Merchant Isolation', () => {
    const foreignMerchantId = '507f1f77bcf86cd799439099';
    const foreignProductId = '507f1f77bcf86cd799439088';

    const multiMerchantCatalog = [
      ...sampleCatalog,
      {
        id: foreignProductId,
        productId: foreignProductId,
        name: 'Foreign Merchant Running Shoes',
        description: 'Shoes from another merchant store',
        category: 'Shoes',
        price: 3600,
        currency: 'INR',
        available: true,
        availability: 'IN_STOCK',
        inventory: 20,
        inventoryStatus: 'IN_STOCK',
        features: ['Foreign brand'],
        tags: ['shoes'],
        merchantId: foreignMerchantId,
        active: true,
        isActive: true,
        relatedProducts: [],
      },
    ];

    it('passes authenticated merchantId to ProductService.getAICatalog and only supplies merchant candidates to AI', async () => {
      let receivedCandidates: any[] = [];
      setAiProvider(async (cart, candidates) => {
        receivedCandidates = candidates;
        return [
          {
            type: 'UPSELL',
            productId: '507f1f77bcf86cd799439014',
            reason: 'Legitimate merchant upgrade',
          },
        ];
      });

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(getAICatalogSpy).toHaveBeenCalledWith(merchantId);
      expect(receivedCandidates.length).toBeGreaterThan(0);
      for (const candidate of receivedCandidates) {
        expect(candidate.merchantId).toBe(merchantId);
      }
    });

    it('extracts merchantId from x-merchant-id header when not in token and scopes catalog', async () => {
      const tokenWithoutMerchant = jwt.sign(
        {
          userId: '507f1f77bcf86cd799439013',
          email: 'anonymous-buyer@buyer.com',
          role: 'customer',
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439014',
          reason: 'Upgrade matching active merchant',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${tokenWithoutMerchant}`)
        .set('x-merchant-id', merchantId)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(getAICatalogSpy).toHaveBeenCalledWith(merchantId);
    });

    it('strictly filters out recommendations if AI returns a product from another merchant', async () => {
      getAICatalogSpy.mockResolvedValue(multiMerchantCatalog as any);

      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: foreignProductId,
          reason: 'Try competitor product',
        },
      ]);

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.recommendations).toHaveLength(0);
    });

    it('executes full flow: active merchant recommendation -> displayed product -> Add Upgrade succeeds (200)', async () => {
      ConversationCartService.clearCart('507f1f77bcf86cd799439013');

      setAiProvider(async () => [
        {
          type: 'UPSELL',
          productId: '507f1f77bcf86cd799439014',
          reason: 'Elite carbon running shoe',
        },
      ]);

      const recResponse = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(recResponse.status).toBe(200);
      expect(recResponse.body.success).toBe(true);
      expect(recResponse.body.recommendations).toHaveLength(1);

      const recommendedProduct = recResponse.body.recommendations[0];
      expect(recommendedProduct.productId).toBe('507f1f77bcf86cd799439014');

      jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
        const idStr = id ? id.toString() : '';
        const found = multiMerchantCatalog.find((p) => p.productId === idStr);
        return Promise.resolve(found ? { ...found, _id: found.id } : null) as any;
      });

      const addRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: recommendedProduct.productId,
          quantity: 1,
          userApproved: true,
        });

      expect(addRes.status).toBe(200);
      expect(addRes.body.success).toBe(true);
      expect(addRes.body.action).toBe('ADD_TO_CART');
      expect(addRes.body.item.productId).toBe('507f1f77bcf86cd799439014');
      expect(addRes.body.cart.subtotal).toBe(3500);
      expect(addRes.body.cart.totalItems).toBe(1);
    });

    it('strictly rejects Add Upgrade if productId belongs to a different merchant (403 MERCHANT_MISMATCH)', async () => {
      jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
        const idStr = id ? id.toString() : '';
        const found = multiMerchantCatalog.find((p) => p.productId === idStr);
        return Promise.resolve(found ? { ...found, _id: found.id } : null) as any;
      });

      const addRes = await request(app)
        .post('/api/agent/actions/add-to-cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: foreignProductId,
          quantity: 1,
          userApproved: true,
        });

      expect(addRes.status).toBe(403);
      expect(addRes.body.success).toBe(false);
      expect(addRes.body.error.code).toBe('MERCHANT_MISMATCH');
      expect(addRes.body.error.message).toContain('Product does not belong to the active merchant store');
    });
  });
});
