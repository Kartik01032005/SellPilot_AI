import request from 'supertest';
import express from 'express';
import { AIController } from '../src/controllers/aiController';
import { IntentService } from '../src/services/intentService';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken, requireMerchant } from '../src/middleware/auth';
import { MerchantController } from '../src/controllers/merchantController';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Step 5 — Merchant Growth + Upsell/Cross-Sell Engine', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/ai/chat', (req, res, next) => {
    if (req.headers.authorization) {
      return authenticateToken(req as any, res, next);
    }
    next();
  }, AIController.chat);

  app.post('/api/ai/intent', AIController.detectIntent);
  app.get('/api/merchant/insights', authenticateToken, requireMerchant, MerchantController.getInsights);
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

  const customerToken = jwt.sign(
    {
      userId: '507f1f77bcf86cd799439013',
      email: 'customer@buyer.com',
      role: 'customer',
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  describe('Merchant Growth Intent Detection', () => {
    it('detects "What should I promote?" as PRODUCT_PROMOTION', () => {
      const res = IntentService.processMessage('What should I promote?', 'merchant');
      expect(res.intent).toBe('PRODUCT_PROMOTION');
    });

    it('detects "Which product has the best opportunity?" as PRODUCT_PROMOTION', () => {
      const res = IntentService.processMessage('Which product has the best opportunity?', 'merchant');
      expect(res.intent).toBe('PRODUCT_PROMOTION');
    });

    it('detects "What should I cross-sell?" as CROSS_SELL_OPPORTUNITY', () => {
      const res = IntentService.processMessage('What should I cross-sell?', 'merchant');
      expect(res.intent).toBe('CROSS_SELL_OPPORTUNITY');
    });

    it('detects "Suggest an upsell" as UPSELL_OPPORTUNITY', () => {
      const res = IntentService.processMessage('Suggest an upsell for our catalog', 'merchant');
      expect(res.intent).toBe('UPSELL_OPPORTUNITY');
    });

    it('detects "Which product is performing best?" as PRODUCT_PERFORMANCE', () => {
      const res = IntentService.processMessage('Which product is performing best?', 'merchant');
      expect(res.intent).toBe('PRODUCT_PERFORMANCE');
    });

    it('detects "How can I increase sales?" as PRODUCT_PROMOTION or REVENUE_IMPROVEMENT', () => {
      const res = IntentService.processMessage('How can I increase sales?', 'merchant');
      expect(['PRODUCT_PROMOTION', 'REVENUE_IMPROVEMENT']).toContain(res.intent);
    });

    it('detects Romanized Hindi merchant query "kya promote karu"', () => {
      const res = IntentService.processMessage('kya promote karu', 'merchant');
      expect(res.intent).toBe('PRODUCT_PROMOTION');
    });

    it('detects Romanized Kannada merchant query "yavudhu promote madbeku"', () => {
      const res = IntentService.processMessage('yavudhu promote madbeku', 'merchant');
      expect(res.intent).toBe('PRODUCT_PROMOTION');
    });
  });

  describe('Merchant Growth API & AI Execution', () => {
    it('rejects unauthenticated user from GET /api/merchant/insights', async () => {
      const res = await request(app).get('/api/merchant/insights');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects customer role from GET /api/merchant/insights', async () => {
      const res = await request(app)
        .get('/api/merchant/insights')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns explainable promotion recommendation via POST /api/ai/chat for merchant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'What should I promote?', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('merchant');
      expect(res.body.intent).toBe('PRODUCT_PROMOTION');
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(10);
    });

    it('returns upsell recommendation via POST /api/ai/chat for merchant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'Suggest an upsell opportunity', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('UPSELL_OPPORTUNITY');
    });

    it('returns cross-sell bundling advice via POST /api/ai/chat for merchant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'What should I cross-sell?', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('CROSS_SELL_OPPORTUNITY');
    });

    it('safely rejects discounts exceeding merchant maximum limit', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ message: 'Give everyone an 80% discount on all items', mode: 'merchant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.intent).toBe('DISCOUNT_RECOMMENDATION');
      expect(res.body.message).toContain('exceeds your configured limit');
    });
  });
});
