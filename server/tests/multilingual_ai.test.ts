import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import aiRouter from '../src/routes/ai';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';
import { IntentService } from '../src/services/intentService';
import { AgentService } from '../src/services/agentService';

describe('Multilingual AI & i18n Natural Language Processing', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRouter);
  app.use(errorHandler);

  const merchantId = '507f1f77bcf86cd799439012';
  const customerUserId = '507f1f77bcf86cd799439013';

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

  const merchantToken = jwt.sign(
    {
      userId: merchantId,
      email: 'merchant@store.com',
      role: 'merchant',
      merchantId,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  describe('IntentService Multilingual Script & Romanized Detection', () => {
    it('detects Kannada from Romanized query ("nanage running shoes beku")', () => {
      const res = IntentService.processMessage('nanage running shoes beku under 3000', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('kn');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Kannada from native Kannada Unicode script', () => {
      const res = IntentService.processMessage('ನನಗೆ ಓಡುವ ಶೂಗಳು ಬೇಕು 3000 ಒಳಗೆ', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('kn');
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Hindi from Romanized query ("mujhe running shoes chahiye")', () => {
      const res = IntentService.processMessage('mujhe running shoes chahiye under 3000', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('hi');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Hindi from native Devanagari script', () => {
      const res = IntentService.processMessage('मुझे जूते चाहिए', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('hi');
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Tamil from Romanized query ("enakku shoes vendum")', () => {
      const res = IntentService.processMessage('enakku shoes vendum under 2500', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('ta');
      expect(res.requirements.maxPrice).toBe(2500);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Tamil from native Tamil Unicode script', () => {
      const res = IntentService.processMessage('எனக்கு காலணிகள் வேண்டும்', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('ta');
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Telugu from Romanized query ("naaku running shoes kaavali")', () => {
      const res = IntentService.processMessage('naaku running shoes kaavali under 3000', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('te');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('detects Telugu from native Telugu Unicode script', () => {
      const res = IntentService.processMessage('నాకు బూట్లు కావాలి', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('te');
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });

    it('defaults to English for standard queries', () => {
      const res = IntentService.processMessage('Find running shoes under 3000', 'buyer');
      expect(res.requirements.detectedLanguage).toBe('en');
      expect(res.requirements.maxPrice).toBe(3000);
      expect(res.intent).toBe('PRODUCT_SEARCH');
    });
  });

  describe('AgentService Buyer Flow with Selected Language & Strict Grounding', () => {
    it('returns localized response in Kannada with exact product name and price preserved', async () => {
      const res = await AgentService.processChatMessage({
        message: 'nanage running shoes beku',
        language: 'kn',
        mode: 'buyer',
        userId: customerUserId,
      });

      expect(res.success).toBe(true);
      expect(res.language).toBe('kn');
      // Must contain Kannada text
      expect(res.message).toContain('ಕಂಡುಕೊಂಡಿದ್ದೇನೆ');
      // Strict Grounding: Must preserve exact product name & ₹ currency symbol
      expect(res.message).toMatch(/₹[\d,]+/);
      expect(res.products && res.products.length > 0).toBe(true);
      expect(res.message).toContain(res.products![0].name);
    });

    it('returns localized response in Hindi with exact product name and price preserved', async () => {
      const res = await AgentService.processChatMessage({
        message: 'mujhe running shoes chahiye',
        language: 'hi',
        mode: 'buyer',
        userId: customerUserId,
      });

      expect(res.success).toBe(true);
      expect(res.language).toBe('hi');
      expect(res.message).toContain('उत्पाद मिले');
      expect(res.message).toMatch(/₹[\d,]+/);
      expect(res.products && res.products.length > 0).toBe(true);
      expect(res.message).toContain(res.products![0].name);
    });

    it('returns localized response in Tamil with exact product name and price preserved', async () => {
      const res = await AgentService.processChatMessage({
        message: 'enakku shoes vendum',
        language: 'ta',
        mode: 'buyer',
        userId: customerUserId,
      });

      expect(res.success).toBe(true);
      expect(res.language).toBe('ta');
      expect(res.message).toContain('தயாரிப்புகளைக்');
      expect(res.message).toMatch(/₹[\d,]+/);
      expect(res.products && res.products.length > 0).toBe(true);
      expect(res.message).toContain(res.products![0].name);
    });

    it('returns localized response in Telugu with exact product name and price preserved', async () => {
      const res = await AgentService.processChatMessage({
        message: 'naaku shoes kaavali',
        language: 'te',
        mode: 'buyer',
        userId: customerUserId,
      });

      expect(res.success).toBe(true);
      expect(res.language).toBe('te');
      expect(res.message).toContain('ఉత్పత్తులను');
      expect(res.message).toMatch(/₹[\d,]+/);
      expect(res.products && res.products.length > 0).toBe(true);
      expect(res.message).toContain(res.products![0].name);
    });

    it('localizes Add to Cart responses across languages', async () => {
      const resKn = await AgentService.processChatMessage({
        message: 'add to cart Pro Running Shoes',
        language: 'kn',
        mode: 'buyer',
        userId: customerUserId,
      });
      expect(resKn.success).toBe(true);
      expect(resKn.message).toContain('ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿದ್ದೇನೆ');
      expect(resKn.message).toContain('Pro Running Shoes');

      const resHi = await AgentService.processChatMessage({
        message: 'add to cart Pro Running Shoes',
        language: 'hi',
        mode: 'buyer',
        userId: customerUserId,
      });
      expect(resHi.success).toBe(true);
      expect(resHi.message).toContain('कार्ट में जोड़ दिया');
      expect(resHi.message).toContain('Pro Running Shoes');
    });

    it('localizes Checkout prompt across languages', async () => {
      const resKn = await AgentService.processChatMessage({
        message: 'proceed to checkout',
        language: 'kn',
        mode: 'buyer',
        userId: customerUserId,
      });
      expect(resKn.message).toContain('Razorpay Test Mode');
      expect(resKn.message).toContain('ಸಿದ್ಧವಾಗಿದೆ');

      const resHi = await AgentService.processChatMessage({
        message: 'checkout karo',
        language: 'hi',
        mode: 'buyer',
        userId: customerUserId,
      });
      expect(resHi.message).toContain('Razorpay Test Mode');
      expect(resHi.message).toContain('तैयार');
    });
  });

  describe('AgentService Merchant Flow with Language & Policy Guardrails', () => {
    it('returns localized merchant discount evaluation in Kannada', async () => {
      const res = await AgentService.processChatMessage({
        message: 'Can I offer 10% discount?',
        language: 'kn',
        mode: 'merchant',
        merchantId,
        userRole: 'merchant',
        userId: merchantId,
      });

      expect(res.success).toBe(true);
      expect(res.language).toBe('kn');
      expect(res.message).toContain('ರಿಯಾಯಿತಿ ಸುರಕ್ಷಿತವಾಗಿದೆ');
      expect(res.message).toContain('25%');
    });

    it('returns localized rejection for discount exceeding 25% in Hindi', async () => {
      const res = await AgentService.processChatMessage({
        message: 'Can I offer 35% discount?',
        language: 'hi',
        mode: 'merchant',
        merchantId,
        userRole: 'merchant',
        userId: merchantId,
      });

      expect(res.success).toBe(false);
      expect(res.language).toBe('hi');
      expect(res.message).toContain('अधिक है');
      expect(res.message).toContain('25%');
    });

    it('returns localized best opportunity advice in Tamil and Telugu', async () => {
      const resTa = await AgentService.processChatMessage({
        message: 'What is my best opportunity?',
        language: 'ta',
        mode: 'merchant',
        merchantId,
        userRole: 'merchant',
        userId: merchantId,
      });
      expect(resTa.success).toBe(true);
      expect(resTa.message).toContain('வாய்ப்பு');

      const resTe = await AgentService.processChatMessage({
        message: 'What is my best opportunity?',
        language: 'te',
        mode: 'merchant',
        merchantId,
        userRole: 'merchant',
        userId: merchantId,
      });
      expect(resTe.success).toBe(true);
      expect(resTe.message).toContain('అవకాశం');
    });
  });

  describe('REST API /api/ai/chat Language Parameter Handling', () => {
    it('respects language parameter sent by frontend in chat payload', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          message: 'Show me running shoes',
          language: 'kn',
          mode: 'buyer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.language).toBe('kn');
      expect(res.body.message).toContain('ಕಂಡುಕೊಂಡಿದ್ದೇನೆ');
    });
  });
});
