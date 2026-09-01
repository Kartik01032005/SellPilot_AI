import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { OrderController } from '../src/controllers/orderController';
import { PaymentController } from '../src/controllers/paymentController';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';
import { OrderService } from '../src/services/orderService';
import { PaymentService } from '../src/services/paymentService';
import { AuditService } from '../src/services/auditService';
import { Order } from '../src/models/Order';
import { Product } from '../src/models/Product';
import { Payment } from '../src/models/Payment';

describe('Step 7 — Production-Grade Order System & Lifecycle', () => {
  const app = express();
  app.use(express.json());

  app.post('/api/orders', authenticateToken, OrderController.createOrder);
  app.post('/api/orders/payment/verify', authenticateToken, OrderController.verifyOrderPayment);
  app.get('/api/orders', authenticateToken, OrderController.getUserOrders);
  app.get('/api/orders/:id', authenticateToken, OrderController.getOrderById);
  app.patch('/api/orders/:id/cancel', authenticateToken, OrderController.cancelOrder);

  app.post('/api/payment/create-order', authenticateToken, PaymentController.createOrder);
  app.post('/api/payment/verify', authenticateToken, PaymentController.verifyPayment);

  app.use(errorHandler);

  const customer1Id = '507f1f77bcf86cd799439011';
  const customer2Id = '507f1f77bcf86cd799439022';

  const customer1Token = jwt.sign(
    { userId: customer1Id, email: 'buyer1@test.com', role: 'customer' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const customer2Token = jwt.sign(
    { userId: customer2Id, email: 'buyer2@test.com', role: 'customer' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.spyOn(AuditService, 'log').mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Order Number Generation & State Transitions', () => {
    it('generates unique readable order numbers starting with SP-ORD-', () => {
      const ordNum1 = OrderService.generateOrderNumber();
      const ordNum2 = OrderService.generateOrderNumber();

      expect(ordNum1).toMatch(/^SP-ORD-\d{8}-[A-Z0-9]+$/);
      expect(ordNum2).toMatch(/^SP-ORD-\d{8}-[A-Z0-9]+$/);
      expect(ordNum1).not.toBe(ordNum2);
    });

    it('enforces valid order status transitions', () => {
      // Allowed transitions
      expect(OrderService.isValidStatusTransition('pending', 'payment_pending')).toBe(true);
      expect(OrderService.isValidStatusTransition('pending', 'cancelled')).toBe(true);
      expect(OrderService.isValidStatusTransition('payment_pending', 'paid')).toBe(true);
      expect(OrderService.isValidStatusTransition('payment_pending', 'failed')).toBe(true);
      expect(OrderService.isValidStatusTransition('paid', 'processing')).toBe(true);
      expect(OrderService.isValidStatusTransition('paid', 'cancelled')).toBe(true);
      expect(OrderService.isValidStatusTransition('processing', 'completed')).toBe(true);
      expect(OrderService.isValidStatusTransition('processing', 'cancelled')).toBe(true);

      // Forbidden transitions
      expect(OrderService.isValidStatusTransition('completed', 'cancelled')).toBe(false);
      expect(OrderService.isValidStatusTransition('failed', 'paid')).toBe(false);
      expect(OrderService.isValidStatusTransition('cancelled', 'paid')).toBe(false);
      expect(OrderService.isValidStatusTransition('completed', 'pending')).toBe(false);
    });
  });

  describe('Order Creation & Validation APIs', () => {
    it('rejects order creation without authentication', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [{ productId: '507f1f77bcf86cd799439099', quantity: 1 }],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects order creation with empty items array', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('rejects order creation with invalid product ID format', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ items: [{ productId: 'not-an-id', quantity: 2 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('rejects order creation with zero or negative quantity', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ items: [{ productId: '507f1f77bcf86cd799439099', quantity: -1 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Authorization & Ownership Protection', () => {
    it('rejects fetching order by invalid ID format', async () => {
      const res = await request(app)
        .get('/api/orders/invalid-mongo-id')
        .set('Authorization', `Bearer ${customer1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });

    it('rejects unauthenticated user from GET /api/orders', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated user from PATCH /api/orders/:id/cancel', async () => {
      const res = await request(app)
        .patch('/api/orders/507f1f77bcf86cd799439099/cancel')
        .send({ reason: 'Changed mind' });

      expect(res.status).toBe(401);
    });

    it('rejects cancelling order if user is not the owner', async () => {
      const targetOrderId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(targetOrderId),
        userId: new mongoose.Types.ObjectId(customer1Id),
        status: 'pending',
        items: [],
        save: jest.fn(),
      };

      jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);

      const res = await request(app)
        .patch(`/api/orders/${targetOrderId}/cancel`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ reason: 'Unauthorized cancel attempt' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('rejects cancelling order in completed status', async () => {
      const targetOrderId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(targetOrderId),
        userId: new mongoose.Types.ObjectId(customer1Id),
        status: 'completed',
        items: [],
        save: jest.fn(),
      };

      jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);

      const res = await request(app)
        .patch(`/api/orders/${targetOrderId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ reason: 'Cancel attempt' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE');
    });
  });

  describe('Payment Verification & Inventory Restock Unit Tests', () => {
    it('restocks inventory when a paid order is cancelled', async () => {
      const prodId = new mongoose.Types.ObjectId();
      const targetOrderId = new mongoose.Types.ObjectId().toString();

      const mockOrder = {
        _id: new mongoose.Types.ObjectId(targetOrderId),
        orderNumber: 'SP-ORD-20260901-TEST1',
        userId: new mongoose.Types.ObjectId(customer1Id),
        status: 'paid',
        items: [{ productId: prodId, quantity: 2, price: 1000, name: 'Shoes' }],
        totalAmount: 2000,
        statusHistory: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const productIncSpy = jest.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue({} as any);
      jest.spyOn(Payment, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/orders/${targetOrderId}/cancel`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ reason: 'Refund requested' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('cancelled');
      expect(productIncSpy).toHaveBeenCalledWith(prodId, { $inc: { stock: 2 } });
    });

    it('verifies payment idempotency: already paid payments return success without duplicate deduction', async () => {
      const prodId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();

      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        orderId,
        status: 'paid',
        verificationStatus: 'verified',
        save: jest.fn(),
      };

      const mockOrder = {
        _id: orderId,
        status: 'paid',
        items: [{ productId: prodId, quantity: 1 }],
      };

      jest.spyOn(Payment, 'findOne').mockResolvedValue(mockPayment as any);
      jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const productIncSpy = jest.spyOn(Product, 'findOneAndUpdate');

      const res = await request(app)
        .post('/api/orders/payment/verify')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          razorpayOrderId: 'order_test_123',
          razorpayPaymentId: 'pay_test_123',
          razorpaySignature: 'sig_test_123',
        });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.status).toBe('paid');
      expect(productIncSpy).not.toHaveBeenCalled();
    });
  });
});

