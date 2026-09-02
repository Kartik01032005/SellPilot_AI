import request from 'supertest';
import express from 'express';
import { PaymentController } from '../src/controllers/paymentController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Payment & Razorpay Safety Foundation', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/payment/create-order', authenticateToken, PaymentController.createOrder);
  app.post('/api/payment/verify', authenticateToken, PaymentController.verifyPayment);
  app.get('/api/payment/:orderId/status', authenticateToken, PaymentController.getPaymentStatus);
  app.use(errorHandler);

  const customerToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439013', email: 'customer@buyer.com', role: 'customer' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  it('rejects payment order creation without authentication', async () => {
    const res = await request(app).post('/api/payment/create-order').send({
      orderId: '507f1f77bcf86cd799439011',
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects payment order creation with missing orderId', async () => {
    const res = await request(app)
      .post('/api/payment/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('rejects payment verification with missing parameters', async () => {
    const res = await request(app)
      .post('/api/payment/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        razorpayOrderId: 'order_123',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('validates orderId on status check', async () => {
      const res = await request(app)
        .get('/api/payment/invalid_order_id/status')
        .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
