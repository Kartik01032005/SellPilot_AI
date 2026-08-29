import request from 'supertest';
import express, { Response } from 'express';
import { ProductController } from '../src/controllers/productController';
import { ProductService } from '../src/services/productService';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken, requireMerchant, AuthRequest } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('Product API & Services', () => {
  const app = express();
  app.use(express.json());

  app.get('/api/products', ProductController.getProducts);
  app.get('/api/products/:id', ProductController.getProductById);
  app.post('/api/products', authenticateToken, requireMerchant, ProductController.createProduct);
  app.get('/api/catalog/ai', ProductController.getAICatalog);
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

  it('rejects product creation by unauthenticated user', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Pro Running Shoes',
      category: 'Shoes',
      price: 2999,
      stock: 15,
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects product creation by customer role (merchant required)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Pro Running Shoes',
        category: 'Shoes',
        price: 2999,
        stock: 15,
      });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('rejects product creation with missing required fields or negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Pro Running Shoes',
        price: -100,
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('validates product ID format on GET /api/products/:id', async () => {
    const res = await request(app).get('/api/products/invalid-id-format');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });
});
