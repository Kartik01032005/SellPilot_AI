import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import agentRouter from '../src/routes/agent';
import { errorHandler } from '../src/middleware/errorHandler';
import { config } from '../src/config/env';

describe('Step 15 — Agent-Readable Catalog & AI Buyer Commerce', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/agent', agentRouter);
  app.use(errorHandler);

  const customerToken = jwt.sign(
    {
      userId: '507f1f77bcf86cd799439013',
      email: 'customer@buyer.com',
      role: 'customer',
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  it('returns structured natural-language search results from the existing agent tool', async () => {
    const response = await request(app)
      .post('/api/agent/search')
      .send({ query: 'running shoes under 3000', maxPrice: 3000 });

    expect(response.status).toBe(200);
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products[0]).toEqual(
      expect.objectContaining({
        productId: expect.any(String),
        price: expect.any(Number),
        currency: 'INR',
        availability: 'IN_STOCK',
        relevanceReason: expect.any(String),
      })
    );
  });

  it('requires an authenticated customer session for AI cart operations', async () => {
    const response = await request(app)
      .post('/api/agent/cart')
      .send({ operation: 'VIEW_CART', sessionId: 'buyer-session-1' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('returns a machine-readable error for invalid authenticated cart operations', async () => {
    const response = await request(app)
      .post('/api/agent/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ operation: 'SET_TOTAL', total: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'INVALID_REQUEST',
      message: expect.any(String),
    });
    expect(response.body).not.toHaveProperty('total');
  });

  it('requires authentication before AI checkout can access a cart', async () => {
    const response = await request(app)
      .post('/api/agent/checkout')
      .send({ sessionId: 'buyer-session-1' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});

