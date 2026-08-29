import request from 'supertest';
import express from 'express';
import { CampaignController } from '../src/controllers/campaignController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken, requireMerchant } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Campaign & Discount Limits Foundation', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/campaigns', authenticateToken, requireMerchant, CampaignController.createCampaign);
  app.post('/api/merchant/discount/validate', authenticateToken, requireMerchant, CampaignController.validateDiscount);
  app.post('/api/campaigns/:id/approve', authenticateToken, requireMerchant, CampaignController.approveCampaign);
  app.post('/api/campaigns/:id/activate', authenticateToken, requireMerchant, CampaignController.activateCampaign);
  app.use(errorHandler);

  const merchantToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', email: 'merchant@store.com', role: 'merchant', merchantId: '507f1f77bcf86cd799439012' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439013', email: 'customer@buyer.com', role: 'customer' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  it('rejects campaign creation by customer role', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Promo',
        productIds: ['507f1f77bcf86cd799439011'],
        discountPercentage: 10,
      });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('rejects campaign creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('rejects discount validation request without discountPercentage', async () => {
    const res = await request(app)
      .post('/api/merchant/discount/validate')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('validates campaign ID on approval', async () => {
    const res = await request(app)
      .post('/api/campaigns/bad-id/approve')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
