import request from 'supertest';
import express from 'express';
import { OrderController } from '../src/controllers/orderController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Order & Checkout Foundation', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/checkout/prepare', OrderController.prepareCheckout);
  app.post('/api/orders', authenticateToken, OrderController.createOrder);
  app.get('/api/orders/:id', authenticateToken, OrderController.getOrderById);
  app.use(errorHandler);

  const customerToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439013', email: 'customer@buyer.com', role: 'customer' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  it('rejects checkout preparation with empty items list', async () => {
    const res = await request(app).post('/api/checkout/prepare').send({
      items: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('rejects checkout with invalid product ID', async () => {
    const res = await request(app).post('/api/checkout/prepare').send({
      items: [{ productId: 'bad_id', quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects order creation without authentication', async () => {
    const res = await request(app).post('/api/orders').send({
      items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('validates order ID format on retrieval', async () => {
    const res = await request(app)
      .get('/api/orders/bad-order-id')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
