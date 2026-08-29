import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, AuthRequest } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';

describe('Auth Middleware & Validation', () => {
  const testApp = express();
  testApp.use(express.json());

  testApp.get('/protected', authenticateToken, (req: AuthRequest, res: Response) => {
    res.status(200).json({ success: true, user: req.user });
  });

  testApp.get(
    '/merchant-only',
    authenticateToken,
    requireRole(['merchant', 'admin']),
    (req: AuthRequest, res: Response) => {
      res.status(200).json({ success: true, message: 'Merchant access granted' });
    }
  );

  testApp.use(errorHandler);

  it('rejects unauthenticated requests to protected endpoint', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('rejects requests with invalid token', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid_token_123');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('allows requests with valid token', async () => {
    const token = jwt.sign(
      { userId: '12345', email: 'test@sellpilot.ai', role: 'customer' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@sellpilot.ai');
  });

  it('forbids customer from merchant-only endpoint', async () => {
    const customerToken = jwt.sign(
      { userId: '12345', email: 'customer@sellpilot.ai', role: 'customer' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const res = await request(testApp)
      .get('/merchant-only')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('code', 'FORBIDDEN');
  });

  it('allows merchant to access merchant-only endpoint', async () => {
    const merchantToken = jwt.sign(
      { userId: '67890', email: 'merchant@sellpilot.ai', role: 'merchant' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const res = await request(testApp)
      .get('/merchant-only')
      .set('Authorization', `Bearer ${merchantToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
