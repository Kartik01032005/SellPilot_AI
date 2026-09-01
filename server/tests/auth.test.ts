import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, AuthRequest } from '../src/middleware/auth';
import { AuthController } from '../src/controllers/authController';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';

describe('Auth Middleware, Registration & Login Validation', () => {
  const testApp = express();
  testApp.use(express.json());

  testApp.post('/api/auth/register', AuthController.register);
  testApp.post('/api/auth/login', AuthController.login);

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

  describe('Registration Validation', () => {
    it('rejects registration with missing name', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Name, email, and password are required');
    });

    it('rejects registration with missing email', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ name: 'John Doe', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Name, email, and password are required');
    });

    it('rejects registration with missing password', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Name, email, and password are required');
    });

    it('rejects registration with password shorter than 6 characters', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'test@example.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Password must be at least 6 characters');
    });
  });

  describe('Login Validation', () => {
    it('rejects login with missing email or password', async () => {
      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email and password are required');
    });
  });

  describe('Token Middleware Protection', () => {
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
});
