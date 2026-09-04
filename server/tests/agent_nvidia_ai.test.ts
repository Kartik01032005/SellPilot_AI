import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import agentRouter from '../src/routes/agent';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { ProductService } from '../src/services/productService';
import {
  AgentRevenueRecommendationService,
  resolveAiProvider,
  buildPromptMessages,
  callNvidiaNimApi,
  extractJsonArray,
  setAiProvider,
  CatalogProduct,
} from '../src/services/agentRevenueRecommendationService';

describe('NVIDIA NIM API Compatibility & Provider Integration', () => {
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

  const sampleCatalog: CatalogProduct[] = [
    {
      productId: '507f1f77bcf86cd799439011',
      name: 'Sony Alpha A7 IV Mirrorless Camera',
      description: '33MP full-frame hybrid camera',
      category: 'Cameras',
      price: 189990,
      available: true,
      merchantId,
      relatedProducts: ['507f1f77bcf86cd799439013'],
      features: ['33MP sensor', '4K 60p'],
      tags: ['camera', 'mirrorless'],
    },
    {
      productId: '507f1f77bcf86cd799439012',
      name: 'Sony Alpha 1 Flagship Camera',
      description: '50MP flagship professional camera',
      category: 'Cameras',
      price: 499990,
      available: true,
      merchantId,
      relatedProducts: ['507f1f77bcf86cd799439013'],
      features: ['50MP sensor', '8K 30p'],
      tags: ['camera', 'flagship'],
    },
    {
      productId: '507f1f77bcf86cd799439013',
      name: 'Sony FE 50mm f/1.8 Lens',
      description: 'Prime standard portrait lens',
      category: 'Lenses',
      price: 19990,
      available: true,
      merchantId,
      relatedProducts: ['507f1f77bcf86cd799439011'],
      features: ['f/1.8 aperture', 'Compact'],
      tags: ['lens', 'prime'],
    },
    {
      productId: '507f1f77bcf86cd799439014',
      name: 'Camera Cleaning Kit (Out of Stock)',
      description: 'Lens blower and sensor swabs',
      category: 'Accessories',
      price: 999,
      available: false,
      merchantId,
      relatedProducts: [],
      features: ['Blower', 'Swabs'],
      tags: ['cleaning'],
    },
  ];

  let getAICatalogSpy: jest.SpyInstance;
  const originalEnv = { ...process.env };
  const originalConfigAi = { ...config.ai };

  beforeEach(() => {
    getAICatalogSpy = jest
      .spyOn(ProductService, 'getAICatalog')
      .mockResolvedValue(sampleCatalog as any);
    setAiProvider(null);
  });

  afterEach(() => {
    getAICatalogSpy.mockRestore();
    setAiProvider(null);
    process.env = { ...originalEnv };
    config.ai = { ...originalConfigAi };
    jest.restoreAllMocks();
  });

  describe('1. Provider Resolution & Configuration', () => {
    it('resolves to nvidia when AI_SERVICE_URL is set to NVIDIA NIM URL', () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-test-key';
      config.ai.provider = '';

      expect(resolveAiProvider()).toBe('nvidia');
    });

    it('resolves to nvidia when AI_PROVIDER is explicitly set to nvidia', () => {
      config.ai.provider = 'nvidia';
      expect(resolveAiProvider()).toBe('nvidia');
    });

    it('resolves to gemini when AI_PROVIDER is explicitly set to gemini', () => {
      config.ai.provider = 'gemini';
      expect(resolveAiProvider()).toBe('gemini');
    });

    it('resolves to gemini when serviceUrl points to googleapis.com', () => {
      config.ai.serviceUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      config.ai.provider = '';
      expect(resolveAiProvider()).toBe('gemini');
    });

    it('resolves to none when no AI provider, URL, or keys are configured', () => {
      config.ai.provider = '';
      config.ai.serviceUrl = '';
      config.ai.apiKey = '';
      delete process.env.AI_PROVIDER;
      delete process.env.AI_SERVICE_URL;
      delete process.env.AI_API_KEY;
      delete process.env.NVIDIA_API_KEY;
      delete process.env.GEMINI_API_KEY;

      expect(resolveAiProvider()).toBe('none');
    });
  });

  describe('2. Prompt Building & OpenAI Chat Format', () => {
    it('builds system and user messages conforming to OpenAI/NVIDIA NIM specifications', () => {
      const cartItems = [sampleCatalog[0]];
      const candidates = [sampleCatalog[1], sampleCatalog[2]];

      const messages = buildPromptMessages(cartItems, candidates);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('You are an AI Revenue Optimization Agent');
      expect(messages[0].content).toContain('UPSELL');
      expect(messages[0].content).toContain('CROSS_SELL');
      expect(messages[0].content).toContain('Available Candidate Products');

      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toContain('Current Cart Items:');
      expect(messages[1].content).toContain('Sony Alpha A7 IV Mirrorless Camera');
      expect(messages[1].content).toContain('Sony FE 50mm f/1.8 Lens');
    });
  });

  describe('3. JSON Array Extraction & Markdown Fence Stripping', () => {
    it('extracts JSON array from raw JSON string', () => {
      const raw = '[{"type":"UPSELL","productId":"123","reason":"Better sensor"}]';
      const parsed = extractJsonArray(raw);
      expect(parsed).toEqual([{ type: 'UPSELL', productId: '123', reason: 'Better sensor' }]);
    });

    it('extracts JSON array wrapped in ```json markdown code fences', () => {
      const raw = '```json\n[\n  {"type":"CROSS_SELL","productId":"456","reason":"Essential lens"}\n]\n```';
      const parsed = extractJsonArray(raw);
      expect(parsed).toEqual([{ type: 'CROSS_SELL', productId: '456', reason: 'Essential lens' }]);
    });

    it('extracts JSON array with conversational prefix and suffix', () => {
      const raw = 'Here are my recommendations:\n[{"type":"UPSELL","productId":"123"}]\nHope this helps boost revenue!';
      const parsed = extractJsonArray(raw);
      expect(parsed).toEqual([{ type: 'UPSELL', productId: '123' }]);
    });

    it('throws error when string does not contain an array', () => {
      expect(() => extractJsonArray('{"type":"UPSELL"}')).toThrow();
      expect(() => extractJsonArray('')).toThrow();
      expect(() => extractJsonArray('Invalid text without brackets')).toThrow();
    });
  });

  describe('4. NVIDIA NIM API Calling Logic', () => {
    it('calls NVIDIA chat/completions endpoint with Bearer auth and payload format', async () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-mock-secret-key';
      config.ai.model = 'meta/llama-3.1-70b-instruct';

      const mockResponseData = {
        id: 'chatcmpl-mock-123',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify([
                {
                  type: 'CROSS_SELL',
                  productId: '507f1f77bcf86cd799439013',
                  reason: 'Perfect 50mm portrait lens for your camera',
                },
              ]),
            },
            finish_reason: 'stop',
          },
        ],
      };

      let requestedUrl = '';
      let requestedHeaders: Record<string, string> = {};
      let requestedBody: any = null;

      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (url, init: any) => {
        requestedUrl = url.toString();
        requestedHeaders = init?.headers || {};
        requestedBody = JSON.parse(init?.body || '{}');

        return {
          ok: true,
          status: 200,
          json: async () => mockResponseData,
        } as any;
      });

      const responseText = await callNvidiaNimApi(
        [sampleCatalog[0]],
        [sampleCatalog[1], sampleCatalog[2]]
      );

      expect(requestedUrl).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
      expect(requestedHeaders['Authorization']).toBe('Bearer nvapi-mock-secret-key');
      expect(requestedHeaders['Content-Type']).toBe('application/json');
      expect(requestedBody.model).toBe('meta/llama-3.1-70b-instruct');
      expect(requestedBody.messages).toHaveLength(2);
      expect(requestedBody.temperature).toBe(0.1);
      expect(requestedBody.max_tokens).toBe(500);

      expect(responseText).toContain('507f1f77bcf86cd799439013');
      fetchSpy.mockRestore();
    });

    it('throws error when NVIDIA NIM API returns non-200 status', async () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-mock-secret-key';

      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        } as any;
      });

      await expect(
        callNvidiaNimApi([sampleCatalog[0]], [sampleCatalog[2]])
      ).rejects.toThrow('NVIDIA API error: HTTP 401');

      fetchSpy.mockRestore();
    });
  });

  describe('5. End-to-End Recommendations with NVIDIA Configuration', () => {
    it('returns grounded recommendations when NVIDIA NIM is configured', async () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-mock-key';
      config.ai.model = 'meta/llama-3.1-70b-instruct';
      config.ai.provider = 'nvidia';

      const mockNvidiaResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify([
                {
                  type: 'UPSELL',
                  productId: '507f1f77bcf86cd799439012',
                  reason: 'Upgrade to 50MP flagship',
                },
                {
                  type: 'CROSS_SELL',
                  productId: '507f1f77bcf86cd799439013',
                  reason: 'Essential prime lens',
                },
              ]),
            },
          },
        ],
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => mockNvidiaResponse,
        } as any;
      });

      const response = await request(app)
        .post('/api/agent/recommendations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cartItems: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toHaveLength(2);

      const upsell = response.body.recommendations.find((r: any) => r.type === 'UPSELL');
      expect(upsell).toBeDefined();
      expect(upsell.productId).toBe('507f1f77bcf86cd799439012');
      expect(upsell.productName).toBe('Sony Alpha 1 Flagship Camera');
      expect(upsell.price).toBe(499990);
      expect(upsell.currentCartTotal).toBe(189990);
      expect(upsell.newCartTotal).toBe(189990 + 499990);

      const crossSell = response.body.recommendations.find((r: any) => r.type === 'CROSS_SELL');
      expect(crossSell).toBeDefined();
      expect(crossSell.productId).toBe('507f1f77bcf86cd799439013');
      expect(crossSell.productName).toBe('Sony FE 50mm f/1.8 Lens');
      expect(crossSell.price).toBe(19990);
      expect(crossSell.newCartTotal).toBe(189990 + 19990);

      fetchSpy.mockRestore();
    });

    it('rejects hallucinated product IDs from NVIDIA NIM response and preserves safety', async () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-mock-key';
      config.ai.provider = 'nvidia';

      const mockNvidiaResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify([
                {
                  type: 'UPSELL',
                  productId: 'hallucinated-camera-id-999',
                  reason: 'Invented camera',
                },
                {
                  type: 'CROSS_SELL',
                  productId: '507f1f77bcf86cd799439014', // out of stock item
                  reason: 'Out of stock kit',
                },
              ]),
            },
          },
        ],
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => mockNvidiaResponse,
        } as any;
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

      fetchSpy.mockRestore();
    });

    it('falls back safely to RECOMMENDATION_UNAVAILABLE when NVIDIA NIM endpoint times out or errors', async () => {
      config.ai.serviceUrl = 'https://integrate.api.nvidia.com/v1';
      config.ai.apiKey = 'nvapi-mock-key';
      config.ai.provider = 'nvidia';

      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
        throw new Error('NVIDIA NIM connection timeout after 5000ms');
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

      fetchSpy.mockRestore();
    });
  });
});
