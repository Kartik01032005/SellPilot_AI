import request from 'supertest';
import express from 'express';
import { AuditController } from '../src/controllers/auditController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken, requireMerchant } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Audit Log Foundation', () => {
  const app = express();
  app.use(express.json());

  app.get('/api/audit', authenticateToken, requireMerchant, AuditController.getLogs);
  app.post('/api/audit', authenticateToken, AuditController.createLog);
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

  it('rejects audit log retrieval by unauthenticated user', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects audit log retrieval by customer role (merchant/admin only)', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('rejects audit log creation without action field', async () => {
    const res = await request(app)
      .post('/api/audit')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
