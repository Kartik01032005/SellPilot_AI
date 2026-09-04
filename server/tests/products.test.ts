import request from 'supertest';
import express, { Response } from 'express';
import { ProductController } from '../src/controllers/productController';
import { ProductService } from '../src/services/productService';
import { errorHandler } from '../src/middleware/errorHandler';
import { authenticateToken, requireMerchant, AuthRequest } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

import { Product } from '../src/models/Product';
import mongoose from 'mongoose';

describe('Product API & Services', () => {
  const app = express();
  app.use(express.json());

  app.get('/api/products', ProductController.getProducts);
  app.get('/api/products/:id', ProductController.getProductById);
  app.post('/api/products', authenticateToken, requireMerchant, ProductController.createProduct);
  app.delete('/api/products/:id', authenticateToken, requireMerchant, ProductController.deleteProduct);
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

  describe('Product Deletion', () => {
    const prodId1 = '507f1f77bcf86cd799439021';
    const prodId2 = '507f1f77bcf86cd799439022';
    const otherMerchantId = '507f1f77bcf86cd799439099';

    const otherMerchantToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439091', email: 'other@store.com', role: 'merchant', merchantId: otherMerchantId },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    let testProducts: Record<string, any> = {};

    beforeEach(() => {
      testProducts = {
        [prodId1]: {
          _id: new mongoose.Types.ObjectId(prodId1),
          merchantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'QA Pro Running Carbon X',
          category: 'Shoes',
          price: 2999,
          stock: 48,
          isActive: true,
        },
        [prodId2]: {
          _id: new mongoose.Types.ObjectId(prodId2),
          merchantId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          name: 'QA Pro Running Carbon X',
          category: 'Shoes',
          price: 2999,
          stock: 48,
          isActive: true,
        },
      };

      jest.spyOn(Product, 'findById').mockImplementation((id: any) => {
        const idStr = id?.toString();
        const p = testProducts[idStr];
        return Promise.resolve(p ? { ...p } : null) as any;
      });

      jest.spyOn(Product, 'findOneAndUpdate').mockImplementation((filter: any, update: any) => {
        const idStr = filter._id?.toString();
        const p = testProducts[idStr];
        if (p && filter.isActive === true && p.isActive) {
          if (filter.merchantId && filter.merchantId.toString() !== p.merchantId.toString()) {
            return { exec: () => Promise.resolve(null) } as any;
          }
          if (update.$set && update.$set.isActive !== undefined) {
            p.isActive = update.$set.isActive;
          }
          return { exec: () => Promise.resolve({ ...p }) } as any;
        }
        return { exec: () => Promise.resolve(null) } as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('rejects unauthenticated product deletion with 401', async () => {
      const res = await request(app).delete(`/api/products/${prodId1}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects customer role from deleting products with 403', async () => {
      const res = await request(app)
        .delete(`/api/products/${prodId1}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('rejects cross-merchant product deletion with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/products/${prodId1}`)
        .set('Authorization', `Bearer ${otherMerchantToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(testProducts[prodId1].isActive).toBe(true);
    });

    it('deletes only the selected product out of two identical products, leaving the other active', async () => {
      const res = await request(app)
        .delete(`/api/products/${prodId1}`)
        .set('Authorization', `Bearer ${merchantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product deleted successfully');

      // Selected product is marked deleted (isActive: false)
      expect(testProducts[prodId1].isActive).toBe(false);
      // Identical other product remains active
      expect(testProducts[prodId2].isActive).toBe(true);
    });
  });
});
