import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { ProductService } from '../services/productService';
import {
  ConversationCartService,
  ConversationCartState,
  CartItemRecord,
} from '../services/conversationCartService';
import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { AuditService } from '../services/auditService';
import { ToolExecutionService } from '../services/toolExecutionService';
import { AgentToolContext } from '../services/toolRegistry';
import { config } from '../config/env';

const toAgentCommerceError = (error: any): any => {
  if (!(error instanceof CustomError)) return error;

  const message = error.message || '';
  let code = error.code;
  if (code === 'NOT_FOUND') code = 'PRODUCT_NOT_FOUND';
  if (code === 'INVALID_REQUEST' && /quantit/i.test(message)) code = 'INVALID_QUANTITY';
  if (code === 'PRODUCT_UNAVAILABLE') code = 'PRODUCT_UNAVAILABLE';

  return code === error.code
    ? error
    : new CustomError(message, error.statusCode, code, error.details);
};

/**
 * Step 15 — Agent-Readable Catalog & AI Buyer Commerce
 *
 * All price and inventory values come from the server (never trusted from client).
 * Checkout delegates to the existing Razorpay + PaymentService implementation.
 */
export class AgentController {
  // ------------------------------------------------------------------
  // 15.2 — GET /api/agent/catalog
  // Machine-readable product catalog for AI buyers
  // ------------------------------------------------------------------
  public static async getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchantId, category, maxPrice, minPrice, inStockOnly, limit } = req.query;

      const products = await ProductService.getAICatalog(merchantId as string | undefined);

      // Apply optional client-side filters on the already-fetched catalog
      let filtered = products;

      if (category) {
        const cat = (category as string).toLowerCase();
        filtered = filtered.filter((p) => p.category.toLowerCase().includes(cat));
      }

      if (minPrice !== undefined) {
        const min = Number(minPrice);
        if (!isNaN(min)) filtered = filtered.filter((p) => p.price >= min);
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);
        if (!isNaN(max)) filtered = filtered.filter((p) => p.price <= max);
      }

      if (inStockOnly === 'true') {
        filtered = filtered.filter((p) => p.available);
      }

      if (limit !== undefined) {
        const lim = Math.min(Math.max(Number(limit) || 20, 1), 50);
        filtered = filtered.slice(0, lim);
      }

      // Resolve session for audit
      const req_ = req as AuthRequest;
      const sessionId = (req.headers['x-ai-session-id'] as string) || undefined;

      await AuditService.log({
        userId: req_.user?.userId,
        action: 'AI_CATALOG_SEARCH',
        entityType: 'Catalog',
        status: 'success',
        metadata: {
          agentType: 'ai_buyer',
          sessionId,
          filters: { category, minPrice, maxPrice, inStockOnly },
          resultCount: filtered.length,
        },
      });

      res.status(200).json({
        success: true,
        schemaVersion: '1.0',
        currency: 'INR',
        count: filtered.length,
        products: filtered.map((p) => ({
          productId: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.price,
          currency: p.currency || 'INR',
          availability: p.availability,
          inventory: p.inventory,
          inventoryStatus: p.inventoryStatus,
          attributes: {},
          features: p.features,
          tags: p.tags,
          sku: p.sku,
          merchantId: p.merchantId,
          relatedProducts: p.relatedProducts,
          active: p.active,
        })),
      });
    } catch (error) {
      next(toAgentCommerceError(error));
    }
  }

  // ------------------------------------------------------------------
  // 15.2 — GET /api/agent/products/:id
  // Real-time product detail for AI buyers (authoritative price + stock)
  // ------------------------------------------------------------------
  public static async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError('Invalid product ID', 400, 'PRODUCT_NOT_FOUND');
      }

      const product = await ProductService.getProductById(id);

      if (!product || !product.isActive) {
        throw new CustomError('Product not found or inactive', 404, 'PRODUCT_NOT_FOUND');
      }

      const req_ = req as AuthRequest;
      await AuditService.log({
        userId: req_.user?.userId,
        action: 'AI_PRODUCT_SELECTED',
        entityType: 'Product',
        entityId: id,
        status: 'success',
        metadata: {
          agentType: 'ai_buyer',
          productName: product.name,
          price: product.price,
          stock: product.stock,
        },
      });

      res.status(200).json({
        success: true,
        product: {
          productId: product._id.toString(),
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          currency: product.currency || 'INR',
          availability: product.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          inventory: product.stock,
          features: product.features || [],
          tags: product.tags || [],
          sku: product.sku,
          attributes: {},
          active: product.isActive,
          // relatedProducts are returned as IDs for further agent lookups
          relatedProducts: (product.relatedProducts as any[]).map((rp: any) =>
            rp._id ? rp._id.toString() : rp.toString()
          ),
        },
      });
    } catch (error) {
      next(toAgentCommerceError(error));
    }
  }

  // ------------------------------------------------------------------
  // 15.3/15.4 — POST /api/agent/search
  // Natural-language product discovery returning structured search results
  // ------------------------------------------------------------------
  public static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        features,
        inStockOnly,
        limit,
        sortBy,
        sessionId,
      } = req.body;

      if (!query && !category) {
        throw new CustomError(
          'Either query or category is required',
          400,
          'INVALID_REQUEST'
        );
      }

      const req_ = req as AuthRequest;
      const context: AgentToolContext = {
        userId: req_.user?.userId,
        conversationId: sessionId as string | undefined,
        language: 'en',
      };

      // Reuse existing searchProducts tool — single source of truth
      const searchResult = await ToolExecutionService.executeTool({
        toolName: 'searchProducts',
        arguments: {
          query: query ? String(query).trim() : undefined,
          category: category ? String(category).trim() : undefined,
          features: Array.isArray(features) ? features.map(String) : [],
          minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
          maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
          inStockOnly: inStockOnly !== false,
          limit: limit ? Math.min(Number(limit) || 6, 20) : 6,
          sortBy: sortBy || 'price_asc',
        },
        context,
      });

      if (!searchResult.success) {
        throw new CustomError(
          searchResult.error || 'Product search failed',
          400,
          'CART_VALIDATION_FAILED'
        );
      }

      const rawProducts = searchResult.data?.products || [];

      // Build 15.4 structured result schema with relevance reasons
      const products = rawProducts.map((p: any) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency || 'INR',
        availability: p.available ? 'IN_STOCK' : 'OUT_OF_STOCK',
        inventory: p.stock,
        category: p.category,
        features: p.features || [],
        relevanceReason: p.reason || `Matches your search criteria in ${p.category}.`,
        attributes: {},
      }));

      await AuditService.log({
        userId: req_.user?.userId,
        action: 'AI_CATALOG_SEARCH',
        entityType: 'Catalog',
        status: 'success',
        metadata: {
          agentType: 'ai_buyer',
          sessionId,
          query,
          category,
          resultCount: products.length,
        },
      });

      res.status(200).json({
        success: true,
        query: query || category,
        count: products.length,
        products,
        searchMeta: {
          filters: { category, minPrice, maxPrice, features, inStockOnly },
          sortBy: sortBy || 'price_asc',
          executionTimeMs: searchResult.executionTimeMs,
        },
      });
    } catch (error) {
      next(toAgentCommerceError(error));
    }
  }

  // ------------------------------------------------------------------
  // 15.7/15.8 — POST /api/agent/cart
  // Controlled cart operations for AI buyers (ADD_ITEM, REMOVE_ITEM,
  // VIEW_CART, UPDATE_QUANTITY). Server validates price + inventory.
  // The AI buyer CANNOT set price, discount, or total.
  // ------------------------------------------------------------------
  public static async cartOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { operation, productId, name, quantity, sessionId } = req.body;

      if (!operation || !['ADD_ITEM', 'REMOVE_ITEM', 'VIEW_CART', 'UPDATE_QUANTITY'].includes(operation)) {
        throw new CustomError(
          'operation must be one of: ADD_ITEM, REMOVE_ITEM, VIEW_CART, UPDATE_QUANTITY',
          400,
          'INVALID_REQUEST'
        );
      }

      const req_ = req as AuthRequest;
      const userId = req_.user?.userId;
      const convId = (sessionId as string) || undefined;
      const correlationId = AgentController.getCorrelationId(req);

      const context: AgentToolContext = {
        userId,
        conversationId: convId,
        language: 'en',
        correlationId,
      };

      if (operation === 'VIEW_CART') {
        const cart = ConversationCartService.getCart(userId, convId);
        let currentItems = cart.items;

        // Refresh every line from the catalog before returning it. This prevents a
        // price or stock change from being hidden behind the in-memory cart copy.
        if (cart.items.length > 0) {
          const checkout = await OrderService.calculateCheckout({
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          });
          const currentById = new Map(checkout.items.map((item) => [item.productId.toString(), item]));
          currentItems = cart.items.map((item) => {
            const current = currentById.get(item.productId);
            if (!current) return item;
            return {
              ...item,
              name: current.name,
              price: current.price,
              currency: checkout.currency,
            };
          });
          cart.items = currentItems;
          cart.updatedAt = new Date();
        }

        const subtotal = currentItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const totalItems = currentItems.reduce((acc, it) => acc + it.quantity, 0);

        res.status(200).json({
          success: true,
          operation: 'VIEW_CART',
          cart: {
            cartId: cart.cartId,
            items: currentItems.map((it) => ({
              productId: it.productId,
              name: it.name,
              price: it.price,
              currency: it.currency,
              quantity: it.quantity,
              lineTotal: it.price * it.quantity,
              category: it.category,
            })),
            totalItems,
            subtotal,
            currency: currentItems[0]?.currency || 'INR',
            updatedAt: cart.updatedAt,
          },
        });
        return;
      }

      if (operation === 'ADD_ITEM' || operation === 'UPDATE_QUANTITY') {
        if (!productId && !name) {
          throw new CustomError('productId or name is required for ADD_ITEM', 400, 'INVALID_REQUEST');
        }

        const qty = quantity !== undefined ? Number(quantity) : 1;
        if (isNaN(qty) || qty <= 0 || qty > 100) {
          throw new CustomError('quantity must be between 1 and 100', 400, 'INVALID_QUANTITY');
        }

        const target = productId || name;
        let cart: ConversationCartState;
        let addedItem: CartItemRecord;

        if (operation === 'UPDATE_QUANTITY') {
          const updated = await ConversationCartService.updateItemQuantity(target, qty, userId, convId);
          cart = updated.cart;
          addedItem = updated.item;
        } else {
          const added = await ConversationCartService.addItem(target, qty, userId, convId);
          cart = added.cart;
          addedItem = added.addedItem;
        }

        const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const totalItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

        const isFirstItem = cart.items.length === 1;
        await AuditService.log({
          userId,
          action: isFirstItem ? 'AI_CART_CREATED' : 'AI_CART_UPDATED',
          entityType: 'Cart',
          entityId: cart.cartId,
          status: 'success',
          metadata: {
            agentType: 'ai_buyer',
            correlationId,
            sessionId: convId,
            operation,
            productId: addedItem.productId,
            productName: addedItem.name,
            quantity: qty,
            serverPrice: addedItem.price,       // proof: server set the price
            subtotal,
          },
        });

        res.status(200).json({
          success: true,
          operation,
          addedItem: {
            productId: addedItem.productId,
            name: addedItem.name,
            price: addedItem.price,             // server-authoritative
            currency: addedItem.currency,
            quantity: addedItem.quantity,
            lineTotal: addedItem.price * addedItem.quantity,
          },
          cart: {
            cartId: cart.cartId,
            totalItems,
            subtotal,                           // server-calculated
            currency: addedItem.currency,
          },
        });
        return;
      }

      if (operation === 'REMOVE_ITEM') {
        if (!productId && !name) {
          throw new CustomError('productId or name is required for REMOVE_ITEM', 400, 'INVALID_REQUEST');
        }

        const target = productId || name;
        const { cart, removed, removedName } = ConversationCartService.removeItem(
          target,
          userId,
          convId
        );

        if (!removed) {
          throw new CustomError(`Item not found in cart: ${target}`, 404, 'PRODUCT_NOT_FOUND');
        }

        const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
        const totalItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

        await AuditService.log({
          userId,
          action: 'AI_CART_UPDATED',
          entityType: 'Cart',
          entityId: cart.cartId,
          status: 'success',
          metadata: {
            agentType: 'ai_buyer',
            correlationId,
            sessionId: convId,
            operation: 'REMOVE_ITEM',
            removedName,
            remainingItems: totalItems,
          },
        });

        res.status(200).json({
          success: true,
          operation: 'REMOVE_ITEM',
          removed: true,
          removedName,
          cart: {
            cartId: cart.cartId,
            totalItems,
            subtotal,
            currency: cart.items[0]?.currency || 'INR',
          },
        });
        return;
      }

      // Should never reach here
      throw new CustomError('Unsupported cart operation', 400, 'INVALID_REQUEST');
    } catch (error) {
      next(error);
    }
  }

  // ------------------------------------------------------------------
  // 15.9/15.10 — POST /api/agent/checkout
  // AI buyer checkout handoff:
  //   1. Server-validates cart items (price + inventory)
  //   2. Creates order via existing OrderService (no price override)
  //   3. Creates Razorpay order via existing PaymentService (no bypass)
  //   4. Returns Razorpay order ID for frontend to complete checkout
  //   5. Full audit trail recorded
  //
  // The AI buyer CANNOT set amount, mark as paid, or skip verification.
  // ------------------------------------------------------------------
  public static async checkout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required to checkout', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.userId;
      const { sessionId, shippingAddress } = req.body;
      const correlationId = AgentController.getCorrelationId(req);
      const idempotencyKey = String(req.get('Idempotency-Key') || '').trim();
      if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
        throw new CustomError(
          'A valid Idempotency-Key header (8-128 safe characters) is required',
          400,
          'INVALID_REQUEST'
        );
      }
      const convId = (sessionId as string) || undefined;

      // 1. Read cart — server owns all item data, price, quantities
      const cart = ConversationCartService.getCart(userId, convId);

      if (!cart.items || cart.items.length === 0) {
        throw new CustomError('Cart is empty. Add items before checkout.', 400, 'CHECKOUT_BLOCKED');
      }

      // 2. Server-side validation of price + inventory via OrderService.calculateCheckout
      //    This independently re-fetches prices from DB — no client price trusted
      const cartItems = cart.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));

      let checkout;
      try {
        checkout = await OrderService.calculateCheckout({
          items: cartItems,
          shippingAddress,
        });
      } catch (calcErr: any) {
        // Map to Step 15 machine-readable error codes
        const code = calcErr.code || 'CHECKOUT_BLOCKED';
        await AuditService.log({
          userId,
          action: 'AI_CHECKOUT_BLOCKED',
          entityType: 'Cart',
          status: 'failed',
          metadata: {
            agentType: 'ai_buyer',
            sessionId: convId,
            correlationId,
            reason: calcErr.message,
            code,
          },
        });
        throw new CustomError(calcErr.message, calcErr.statusCode || 400, code);
      }

      await AuditService.log({
        userId,
        action: 'AI_CHECKOUT_STARTED',
        entityType: 'Cart',
        status: 'pending',
        metadata: {
          agentType: 'ai_buyer',
          sessionId: convId,
          correlationId,
          itemCount: checkout.items.length,
          subtotal: checkout.subtotal,
          total: checkout.total,
          currency: checkout.currency,
        },
      });

      // 3. Create order via existing OrderService (server-authoritative amount)
      const idempotencyFingerprint = crypto
        .createHash('sha256')
        .update(JSON.stringify({ items: cartItems, shippingAddress: shippingAddress || {} }))
        .digest('hex');

      let order;
      try {
        order = await OrderService.createOrder(userId, {
          items: cartItems,
          shippingAddress,
          idempotencyKey,
          idempotencyFingerprint,
          correlationId,
        });
      } catch (orderErr: any) {
        await AuditService.log({
          userId,
          action: 'AI_ORDER_FAILED',
          entityType: 'Order',
          status: 'failed',
          metadata: { agentType: 'ai_buyer', sessionId: convId, correlationId, reason: orderErr.message },
        });
        throw orderErr;
      }

      await AuditService.log({
        userId,
        action: 'AI_ORDER_CREATED',
        entityType: 'Order',
        entityId: order._id.toString(),
        amount: order.totalAmount,
        status: 'success',
        metadata: {
          agentType: 'ai_buyer',
          sessionId: convId,
          idempotencyKey,
          orderNumber: order.orderNumber,
          total: order.totalAmount,
          correlationId,
        },
      });

      // 4. Create Razorpay order via existing PaymentService (no modification)
      let razorpayResult;
      try {
        razorpayResult = await PaymentService.createRazorpayOrder(
          order._id.toString(),
          userId
        );
      } catch (payErr: any) {
        await AuditService.log({
          userId,
          action: 'AI_ORDER_FAILED',
          entityType: 'Order',
          entityId: order._id.toString(),
          status: 'failed',
          metadata: { agentType: 'ai_buyer', sessionId: convId, correlationId, reason: payErr.message },
        });
        throw payErr;
      }

      await AuditService.log({
        userId,
        action: 'AI_PAYMENT_STARTED',
        entityType: 'Payment',
        entityId: order._id.toString(),
        amount: razorpayResult.amount,
        status: 'pending',
        metadata: {
          agentType: 'ai_buyer',
          sessionId: convId,
          idempotencyKey,
          orderId: order._id.toString(),
          razorpayOrderId: razorpayResult.razorpayOrderId,
          correlationId,
          // NOTE: No secret keys, signatures, or credentials in audit log
        },
      });

      // 5. Return checkout handoff data — Razorpay order ID for client to complete payment
      // Payment verification happens via existing POST /api/payment/verify (HMAC, unchanged)
      res.status(200).json({
        success: true,
        message: 'Checkout ready. Complete payment using Razorpay Test Mode.',
        checkout: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          subtotal: checkout.subtotal,
          discount: checkout.discount,
          total: checkout.total,              // server-authoritative total
          currency: checkout.currency,
          itemCount: checkout.items.length,
          correlationId,
        },
        razorpay: {
          orderId: razorpayResult.razorpayOrderId,
          amount: razorpayResult.amount,      // server-authoritative amount in INR
          currency: razorpayResult.currency,
          keyId: config.razorpay.keyId,
          testMode: config.razorpay.isTestMode,
          // Razorpay key_id is exposed to client — NOT key_secret (never exposed)
          // The public test key is returned by the backend payment endpoint.
        },
        nextSteps: [
          'Use razorpay.orderId to open Razorpay checkout modal',
          `After payment, POST /api/payment/verify with { razorpayOrderId, razorpayPaymentId, razorpaySignature }`,
          'Server will verify HMAC signature and confirm order',
        ],
      });
    } catch (error) {
      next(toAgentCommerceError(error));
    }
  }

  private static getCorrelationId(req: Request): string {
    const header = req.get('X-Correlation-ID');
    if (header && /^spc_[a-f0-9-]{36}$/.test(header)) return header;
    return `spc_${crypto.randomUUID()}`;
  }
}
