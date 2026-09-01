import request from 'supertest';
import express from 'express';
import { OrderController } from '../src/controllers/orderController';
import { PaymentController } from '../src/controllers/paymentController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';
import { OrderService } from '../src/services/orderService';
import { PaymentService } from '../src/services/paymentService';

describe('Step 6 — Agentic Checkout, Payment Flow & Order Completion', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/checkout/prepare', OrderController.prepareCheckout);
  app.post('/api/orders', authenticateToken, OrderController.createOrder);
  app.get('/api/orders/:id', authenticateToken, OrderController.getOrderById);
  app.get('/api/orders', authenticateToken, OrderController.getUserOrders);

  app.post('/api/payment/create-order', authenticateToken, PaymentController.createOrder);
  app.post('/api/payment/verify', authenticateToken, PaymentController.verifyPayment);
  app.post('/api/payment/cancel', authenticateToken, PaymentController.cancelPayment);
  app.get('/api/payment/:orderId/status', PaymentController.getPaymentStatus);

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

  describe('Server-Side Price & Checkout Verification', () => {
    it('rejects checkout preparation with empty items list', async () => {
      const res = await request(app)
        .post('/api/checkout/prepare')
        .send({ items: [] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('rejects checkout with non-existent or invalid product ID format', async () => {
      const res = await request(app)
        .post('/api/checkout/prepare')
        .send({ items: [{ productId: 'invalid-id', quantity: 1 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('rejects checkout with negative or zero quantity', async () => {
      const res = await request(app)
        .post('/api/checkout/prepare')
        .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 0 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Order Creation & Retrieval', () => {
    it('rejects unauthenticated user from POST /api/orders', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects order retrieval without valid order ID format', async () => {
      const res = await request(app)
        .get('/api/orders/not-an-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Razorpay Test Mode Payment & Verification Flow', () => {
    it('rejects payment order creation without authentication', async () => {
      const res = await request(app)
        .post('/api/payment/create-order')
        .send({ orderId: '507f1f77bcf86cd799439014' });

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

    it('rejects payment cancellation with missing orderId', async () => {
      const res = await request(app)
        .post('/api/payment/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });
  });
});
