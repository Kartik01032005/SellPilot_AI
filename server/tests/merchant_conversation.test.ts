import request from 'supertest';
import express from 'express';
import { AIController } from '../src/controllers/aiController';
import { IntentService } from '../src/services/intentService';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Merchant Conversational Intelligence & Referential Resolution', () => {
  const app = express();
  app.use(express.json());

  app.post(
    '/api/ai/chat',
    (req, res, next) => {
      if (req.headers.authorization) {
        return authenticateToken(req as any, res, next);
      }
      next();
    },
    AIController.chat
  );

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

  describe('Intent & Sub-Intent Parsing', () => {
    it('accurately distinguishes "What should I promote?" from "Which product has the best opportunity?"', () => {
      const promoteRes = IntentService.processMessage('What should I promote?', 'merchant');
      const bestOppRes = IntentService.processMessage('Which product has the best opportunity?', 'merchant');

      expect(promoteRes.intent).toBe('PRODUCT_PROMOTION');
      expect(bestOppRes.intent).toBe('PRODUCT_PROMOTION');

      expect(promoteRes.subIntent).toBe('GENERAL_PROMOTION');
      expect(bestOppRes.subIntent).toBe('BEST_OPPORTUNITY');
    });

    it('detects discount percentage and marks discount evaluation sub-intent', () => {
      const res = IntentService.processMessage('Can I give a 20% discount?', 'merchant');
      expect(res.requirements.discountPercentage).toBe(20);
      expect(res.subIntent).toBe('DISCOUNT_EVALUATION');
    });

    it('detects follow-up questions with discount modifications', () => {
      const res = IntentService.processMessage('What about 15%?', 'merchant');
      expect(res.requirements.discountPercentage).toBe(15);
      expect(res.requirements.isFollowUp).toBe(true);
    });

    it('detects follow-up "Why this product?" questions', () => {
      const res = IntentService.processMessage('Why this product?', 'merchant');
      expect(res.subIntent).toBe('FOLLOW_UP_REASON');
      expect(res.requirements.isFollowUp).toBe(true);
    });

    it('detects "Which shoes should I promote?" as category-scoped promotion', () => {
      const res = IntentService.processMessage('Which shoes should I promote?', 'merchant');
      expect(res.requirements.category).toBe('Shoes');
      expect(res.subIntent).toBe('CATEGORY_PROMOTION');
    });

    it('detects "What about the other shoe?" as referential alternative query', () => {
      const res = IntentService.processMessage('What about the other shoe?', 'merchant');
      expect(res.requirements.isAlternativeReferenced).toBe(true);
      expect(res.requirements.isFollowUp).toBe(true);
      expect(res.requirements.category).toBe('Shoes');
      expect(res.subIntent).toBe('ALTERNATIVE_PRODUCT_QUERY');
    });

    it('detects "What about 15% for the other shoe?" as discount evaluation on alternative', () => {
      const res = IntentService.processMessage('What about 15% for the other shoe?', 'merchant');
      expect(res.requirements.isAlternativeReferenced).toBe(true);
      expect(res.requirements.discountPercentage).toBe(15);
      expect(res.subIntent).toBe('DISCOUNT_EVALUATION');
    });
  });

  describe('Referential Context Resolution & Grounded Dynamic Responses', () => {
    const conversationId = '507f1f77bcf86cd799439099';

    it('answers "Which shoes should I promote?" with a shoe-specific answer', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Which shoes should I promote?',
          mode: 'merchant',
          conversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Shoes');
      expect(res.body.message).toMatch(/Pro Carbon Running Shoes|Ultra Grip Road/i);
    });

    it('answers "Why this product?" by explaining signals for the currently referenced product', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Why this product?',
          mode: 'merchant',
          conversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/stock|inventory|margin|demand/i);
      expect(res.body.message).toContain('Pro Carbon Running Shoes');
    });

    it('resolves "What about the other shoe?" to Ultra Grip Road Running Shoes with upsell relationship and NO invented discounts', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'What about the other shoe?',
          mode: 'merchant',
          conversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Resolves to the alternative shoe
      expect(res.body.message).toMatch(/Ultra Grip Road/i);
      // Mentions the actual price (2,499) and stock or relationship
      expect(res.body.message).toMatch(/2,499|500|upsell/i);
      // Must NOT invent or recommend an unsupported discount percentage
      expect(res.body.message).not.toMatch(/\b(?:10%|15%|20%|25%)\s+discount\b/i);
    });

    it('evaluates "What about 15% for the other shoe?" specifically for Ultra Grip Road Running Shoes within the 25% ceiling', async () => {
      const convDiscount = '507f1f77bcf86cd799439066';
      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Which shoes should I promote?',
          mode: 'merchant',
          conversationId: convDiscount,
        });

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'What about 15% for the other shoe?',
          mode: 'merchant',
          conversationId: convDiscount,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('15%');
      expect(res.body.message).toMatch(/Ultra Grip Road/i);
      expect(res.body.message.toLowerCase()).toMatch(/safe|within/);
    });

    it('resolves "What about the other product?" using conversation context', async () => {
      // First discuss Pro Carbon Running Shoes
      const convB = '507f1f77bcf86cd799439088';
      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'What should I promote?',
          mode: 'merchant',
          conversationId: convB,
        });

      // Follow-up: "What about the other product?"
      const otherRes = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'What about the other product?',
          mode: 'merchant',
          conversationId: convB,
        });

      expect(otherRes.status).toBe(200);
      expect(otherRes.body.success).toBe(true);
      expect(otherRes.body.message).toMatch(/Ultra Grip Road/i);
    });

    it('asks a clarification question when referential query has missing product context', async () => {
      const freshConv = '507f1f77bcf86cd799439077';
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'What about the other product?',
          mode: 'merchant',
          conversationId: freshConv,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message.toLowerCase()).toMatch(/which product or category|clarify|specify/i);
    });

    it('safely rejects discounts exceeding the 25% ceiling', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Give everyone an 80% discount on shoes',
          mode: 'merchant',
          conversationId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.intent).toBe('DISCOUNT_RECOMMENDATION');
      expect(res.body.message).toContain('exceeds your configured limit');
      expect(res.body.message).toContain('25%');
    });

    it('safely rejects "Can I give a 30% discount?" as exceeding the 25% ceiling', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Can I give a 30% discount?',
          mode: 'merchant',
          conversationId: '507f1f77bcf86cd799439055',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.intent).toBe('DISCOUNT_RECOMMENDATION');
      expect(res.body.message).toContain('exceeds your configured limit');
      expect(res.body.message).toContain('25%');
    });
  });
});
