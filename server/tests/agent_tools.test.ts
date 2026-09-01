import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { ToolRegistry } from '../src/services/toolRegistry';
import { ToolExecutionService } from '../src/services/toolExecutionService';
import { ConversationCartService } from '../src/services/conversationCartService';
import jwt from 'jsonwebtoken';

describe('Step 8 — Real Agent Tool Execution & Safety Engine', () => {
  const customerToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), email: 'buyer@test.com', role: 'customer' },
    process.env.JWT_SECRET || 'test_secret_key_12345'
  );

  const merchantUserId = new mongoose.Types.ObjectId().toString();
  const merchantToken = jwt.sign(
    { userId: merchantUserId, merchantId: merchantUserId, email: 'merchant@store.com', role: 'merchant' },
    process.env.JWT_SECRET || 'test_secret_key_12345'
  );

  beforeEach(() => {
    ConversationCartService.clearCart();
  });

  describe('1. Tool Registry & Discovery', () => {
    it('registers all required commerce tools', () => {
      const tools = ToolRegistry.getAllTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('searchProducts');
      expect(toolNames).toContain('getProductDetails');
      expect(toolNames).toContain('compareProducts');
      expect(toolNames).toContain('checkInventory');
      expect(toolNames).toContain('getCart');
      expect(toolNames).toContain('addToCart');
      expect(toolNames).toContain('removeFromCart');
      expect(toolNames).toContain('calculateCart');
      expect(toolNames).toContain('getCrossSells');
      expect(toolNames).toContain('getUpsell');
      expect(toolNames).toContain('getMerchantInsights');
      expect(toolNames).toContain('validateDiscount');
    });

    it('GET /api/ai/tools returns tool schemas and metadata', async () => {
      const res = await request(app).get('/api/ai/tools');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tools)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(12);

      const searchTool = res.body.tools.find((t: any) => t.name === 'searchProducts');
      expect(searchTool).toBeDefined();
      expect(searchTool.parametersSchema).toHaveProperty('maxPrice');
    });

    it('filters tool list by mode', async () => {
      const resBuyer = await request(app).get('/api/ai/tools?mode=buyer');
      expect(resBuyer.status).toBe(200);
      const buyerToolNames = resBuyer.body.tools.map((t: any) => t.name);
      expect(buyerToolNames).toContain('addToCart');
      expect(buyerToolNames).not.toContain('getMerchantInsights');
    });
  });

  describe('2. Direct Tool Execution & Validation (POST /api/ai/tools/execute)', () => {
    it('rejects execution of an unknown tool', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .send({ toolName: 'unregistered_hack_tool', arguments: {} });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unknown tool');
    });

    it('executes searchProducts with valid price constraints', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'searchProducts',
          arguments: { category: 'Shoes', maxPrice: 3500 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeDefined();
      expect(res.body.executionTimeMs).toBeDefined();
    });

    it('rejects searchProducts with negative price bounds', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'searchProducts',
          arguments: { minPrice: -500 },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('minPrice must be a non-negative number');
    });

    it('executes checkInventory and returns stock availability', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'checkInventory',
          arguments: { name: 'Pro Running Shoes', requestedQuantity: 2 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(true);
      expect(res.body.data.stock).toBeGreaterThanOrEqual(1);
    });

    it('executes addToCart, getCart, and calculateCart flow', async () => {
      // 1. Add Item
      const addRes = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'addToCart',
          arguments: { name: 'Pro Running Shoes', quantity: 2, conversationId: 'test_session_cart' },
        });

      expect(addRes.status).toBe(200);
      expect(addRes.body.success).toBe(true);
      expect(addRes.body.data.totalItems).toBe(2);

      // 2. View Cart
      const cartRes = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'getCart',
          arguments: { conversationId: 'test_session_cart' },
        });

      expect(cartRes.status).toBe(200);
      expect(cartRes.body.data.totalItems).toBe(2);
      expect(cartRes.body.data.subtotal).toBeGreaterThan(0);

      // 3. Calculate Cart
      const calcRes = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'calculateCart',
          arguments: { conversationId: 'test_session_cart', discountPercentage: 10 },
        });

      expect(calcRes.status).toBe(200);
      expect(calcRes.body.data.discount).toBeGreaterThan(0);
      expect(calcRes.body.data.total).toBeLessThan(calcRes.body.data.subtotal);
    });

    it('forbids unauthenticated access to merchant-only tools', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .send({
          toolName: 'getMerchantInsights',
          arguments: {},
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('authentication');
    });

    it('forbids customer role from executing merchant-only tools', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          toolName: 'getMerchantInsights',
          arguments: {},
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('requires merchant role');
    });

    it('allows authorized merchant to execute getMerchantInsights', async () => {
      const res = await request(app)
        .post('/api/ai/tools/execute')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          toolName: 'getMerchantInsights',
          arguments: {},
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.insights).toBeDefined();
    });
  });

  describe('3. Agent Conversational Reasoning & Tool Execution (POST /api/ai/chat)', () => {
    it('executes searchProducts tool for buyer search intent and returns toolsExecuted trace', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Find me running shoes under 3000',
          mode: 'buyer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeDefined();
      expect(Array.isArray(res.body.toolsExecuted)).toBe(true);
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('searchProducts');
    });

    it('executes checkInventory and addToCart when user asks to add product to cart', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Add Pro Running Shoes to my cart',
          mode: 'buyer',
          conversationId: 'conv_agent_test',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('ADD_TO_CART');
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('checkInventory');
      expect(usedTools).toContain('addToCart');
    });

    it('executes getCart when user asks to view cart contents', async () => {
      // Seed an item first
      ConversationCartService.addItem('Pro Running Shoes', 1, undefined, 'conv_view_test');

      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What is in my cart?',
          mode: 'buyer',
          conversationId: 'conv_view_test',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('VIEW_CART');
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('getCart');
    });

    it('executes getCrossSells when buyer asks "What else should I buy with it?"', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What else should I buy with it?',
          mode: 'buyer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('CROSS_SELL');
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('getCrossSells');
    });

    it('executes compareProducts when buyer asks "Which is cheapest?"', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Which is cheapest?',
          mode: 'buyer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('PRODUCT_COMPARISON');
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('compareProducts');
    });

    it('executes validateDiscount and rejects unsafe merchant discount', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({
          message: 'Give everyone an 80% discount on shoes',
          mode: 'merchant',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds your configured limit');
      const usedTools = res.body.toolsExecuted.map((t: any) => t.tool);
      expect(usedTools).toContain('validateDiscount');
    });
  });
});
