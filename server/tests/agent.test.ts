import request from 'supertest';
import express from 'express';
import { AIController } from '../src/controllers/aiController';
import { IntentService } from '../src/services/intentService';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('AI Agent & Intent Detection Engine', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/ai/chat', (req, res, next) => {
    if (req.headers.authorization) {
      return authenticateToken(req as any, res, next);
    }
    next();
  }, AIController.chat);

  app.post('/api/ai/intent', AIController.detectIntent);
  app.use(errorHandler);

  const merchantToken = jwt.sign(
    {
      userId: '507f1f77bcf86cd799439011',
      email: 'merchant@store.com',
      role: 'merchant',
      merchantId: '507f1f77bcf86cd799439012',
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  describe('Intent & Requirement Extraction Unit Logic', () => {
    it('extracts category and numeric price from English query', () => {
      const res = IntentService.processMessage('I need running shoes under 3000', 'buyer');
      expect(res.requirements.category).toBe('Shoes');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('extracts price multipliers like 50k and 3k correctly', () => {
      const req1 = IntentService.extractRequirements('laptop under 50k with 16gb ram');
      expect(req1.category).toBe('Laptops');
      expect(req1.maxPrice).toBe(50000);
      expect(req1.features).toContain('16gb');

      const req2 = IntentService.extractRequirements('shoe under 3k');
      expect(req2.maxPrice).toBe(3000);
    });

    it('recognizes Romanized Kannada input (nanage running shoes beku under 3000)', () => {
      const res = IntentService.processMessage('nanage running shoes beku under 3000', 'buyer');
      expect(res.requirements.category).toBe('Shoes');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.requirements.detectedLanguage).toBe('kn');
    });

    it('recognizes Romanized Hindi input (mujhe running shoes chahiye)', () => {
      const res = IntentService.processMessage('mujhe running shoes chahiye under 2500', 'buyer');
      expect(res.requirements.category).toBe('Shoes');
      expect(res.requirements.maxPrice).toBe(2500);
      expect(res.requirements.detectedLanguage).toBe('hi');
    });

    it('recognizes Romanized Tamil & Telugu input', () => {
      const ta = IntentService.processMessage('enakku shoe venum', 'buyer');
      expect(ta.requirements.category).toBe('Shoes');
      expect(ta.requirements.detectedLanguage).toBe('ta');

      const te = IntentService.processMessage('naaku shoes kavali', 'buyer');
      expect(te.requirements.category).toBe('Shoes');
      expect(te.requirements.detectedLanguage).toBe('te');
    });

    it('detects follow-up comparison intents (which is cheapest?)', () => {
      const res = IntentService.processMessage('which is cheapest?', 'buyer');
      expect(res.intent).toBe('PRODUCT_COMPARISON');
      expect(res.requirements.isCheapestRequested).toBe(true);
    });

    it('detects merchant promotion queries (What should I promote?)', () => {
      const res1 = IntentService.processMessage('What should I promote?', 'merchant');
      expect(res1.intent).toBe('PRODUCT_PROMOTION');

      const res2 = IntentService.processMessage('Which product needs advertising to increase sales?', 'merchant');
      expect(res2.intent).toBe('PRODUCT_PROMOTION');
    });
  });

  describe('AI Endpoints (POST /api/ai/intent & POST /api/ai/chat)', () => {
    it('POST /api/ai/intent returns structured parsed intent and requirements', async () => {
      const res = await request(app)
        .post('/api/ai/intent')
        .send({ message: 'I want pro laptop under 75000 with 16gb' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requirements.category).toBe('Laptops');
      expect(res.body.requirements.maxPrice).toBe(75000);
      expect(res.body.requirements.features).toContain('16gb');
    });

    it('POST /api/ai/chat rejects empty or missing message', async () => {
      const res = await request(app).post('/api/ai/chat').send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('POST /api/ai/chat handles buyer purchase intent with checkout confirmation request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'buy this now and proceed to payment', mode: 'buyer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresConfirmation).toBe(true);
      expect(res.body.intent).toBe('PURCHASE_REQUEST');
    });

    it('POST /api/ai/chat handles buyer search and returns explainable response', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'I need running shoes under 3000', mode: 'buyer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('intent');
      expect(res.body).toHaveProperty('message');
    });

    it('POST /api/ai/chat returns merchant growth recommendation for authorized merchant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'What should I promote?', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('merchant');
      expect(res.body.intent).toBe('PRODUCT_PROMOTION');
      expect(res.body).toHaveProperty('message');
    });

    it('POST /api/ai/chat rejects unsafe discount exceeding merchant limit', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'Give everyone an 80% discount on shoes', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.intent).toBe('DISCOUNT_RECOMMENDATION');
      expect(res.body.message).toContain('exceeds your configured limit');
    });

    it('POST /api/ai/chat processes Romanized query (nanage running shoes beku under 3000)', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'nanage running shoes beku under 3000', mode: 'buyer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeDefined();
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });
});
