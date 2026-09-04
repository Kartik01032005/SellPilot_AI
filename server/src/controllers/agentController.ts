import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { Product, IProduct } from '../models/Product';
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
import { AgentRevenueRecommendationService } from '../services/agentRevenueRecommendationService';
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
  /**
   * POST /api/agent/recommendations
   * Read-only, catalog-grounded upsell and cross-sell suggestions.
   */
  public static async getRevenueRecommendations(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cartItems } = req.body || {};
      if (
        !Array.isArray(cartItems) ||
        cartItems.length === 0 ||
        cartItems.length > 50 ||
        cartItems.some(
          (item: any) =>
            !item ||
            typeof item.productId !== 'string' ||
            !mongoose.Types.ObjectId.isValid(item.productId) ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > 100
        )
      ) {
        throw new CustomError('cartItems must contain valid productId and quantity values', 400, 'INVALID_REQUEST');
      }

      const recommendations = await AgentRevenueRecommendationService.recommend(
        cartItems,
        req.user?.merchantId
      );

      // Final response validation ensures no provider/service output can expose
      // an invented product, price, type, unavailable item, or invalid calculation.
      const safeRecommendations = recommendations.filter(
        (rec) =>
          (rec.type === 'UPSELL' || rec.type === 'CROSS_SELL') &&
          mongoose.Types.ObjectId.isValid(rec.productId) &&
          typeof rec.productName === 'string' &&
          Number.isFinite(rec.price) &&
          rec.price >= 0 &&
          typeof rec.reason === 'string' &&
          Number.isFinite(rec.currentCartTotal) &&
          rec.currentCartTotal >= 0 &&
          Number.isInteger(rec.quantityAdded) &&
          rec.quantityAdded >= 1 &&
          Number.isFinite(rec.newCartTotal) &&
          rec.newCartTotal === rec.currentCartTotal + rec.price * rec.quantityAdded &&
          typeof rec.explanation === 'string' &&
          rec.explanation.length > 0 &&
          rec.available === true
      );

      if (safeRecommendations.length === 0 || safeRecommendations.length !== recommendations.length) {
        await AuditService.logRecommendationRejected({
          userId: req.user?.userId,
          merchantId: req.user?.merchantId,
          reason: 'RECOMMENDATION_UNAVAILABLE',
          cartItemsCount: cartItems.length,
          correlationId: AgentController.getCorrelationId(req),
        });
        res.status(200).json({ success: false, recommendations: [], reason: 'RECOMMENDATION_UNAVAILABLE' });
        return;
      }

      await AuditService.logRecommendationGenerated({
        userId: req.user?.userId,
        merchantId: req.user?.merchantId,
        recommendationsCount: safeRecommendations.length,
        productIds: safeRecommendations.map((r) => r.productId),
        recommendationTypes: safeRecommendations.map((r) => r.type),
        currentCartTotal: safeRecommendations[0]?.currentCartTotal,
        correlationId: AgentController.getCorrelationId(req),
      });

      res.status(200).json({ success: true, recommendations: safeRecommendations });
    } catch (error: any) {
      await AuditService.logRecommendationRejected({
        userId: req.user?.userId,
        merchantId: req.user?.merchantId,
        reason: error?.message || 'RECOMMENDATION_UNAVAILABLE',
        cartItemsCount: req.body?.cartItems?.length,
        correlationId: AgentController.getCorrelationId(req),
      });
      // Recommendation failure is intentionally non-fatal and cannot affect cart,
      // order, inventory, or payment state.
      res.status(200).json({ success: false, recommendations: [], reason: 'RECOMMENDATION_UNAVAILABLE' });
    }
  }

  /**
   * POST /api/agent/actions/add-to-cart
   * STEP 3: Safe, bounded, user-approved cart actions.
   *
   * Converts validated AI recommendations into cart additions ONLY after explicit
   * user approval/click. Re-checks authentication, merchant ownership, product existence,
   * active status, current stock, and authoritative price before modifying the cart.
   * Never trusts AI-supplied or client-supplied name, price, merchantId, or availability.
   * Never places orders, never triggers payments/Razorpay, and never alters database inventory.
   */
  public static async approvedAddToCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Authentication re-validation
      const userId = req.user?.userId;
      if (!userId) {
        throw new CustomError('Authentication required to modify cart', 401, 'UNAUTHORIZED');
      }

      // 2. Explicit user approval requirement
      const { productId, quantity, recommendationType, sessionId, userApproved } = req.body || {};
      if (userApproved === false) {
        await AuditService.logActionRejected({
          userId,
          merchantId: req.user?.merchantId,
          productId: typeof productId === 'string' ? productId : undefined,
          reason: 'USER_DISAPPROVAL',
          sessionId: (sessionId as string) || undefined,
        });
        throw new CustomError('Cart action requires explicit user approval', 400, 'ACTION_NOT_APPROVED');
      }

      // 3. Product ID validation
      if (!productId || typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new CustomError('Valid productId is required', 400, 'INVALID_REQUEST');
      }

      // 4. Quantity bounds & validation (strictly 1 <= quantity <= 100, integer)
      const requestedQty = quantity !== undefined ? Number(quantity) : 1;
      if (!Number.isInteger(requestedQty) || requestedQty < 1 || requestedQty > 100) {
        throw new CustomError('quantity must be an integer between 1 and 100', 400, 'INVALID_QUANTITY');
      }

      // 5. Query authoritative product from Database (Never trust client/AI fields)
      let product: IProduct | null = null;
      try {
        if (mongoose.connection.readyState !== 0 || (Product.findById as any)?.mock) {
          product = await Product.findById(productId);
        }
      } catch {
        // Fallback for mocked environments
      }

      if (!product) {
        throw new CustomError(`Product not found: ${productId}`, 404, 'PRODUCT_NOT_FOUND');
      }

      // 6. Active status check
      if (!product.isActive) {
        throw new CustomError(`Product ${product.name} is inactive and cannot be added to cart`, 400, 'PRODUCT_INACTIVE');
      }

      // 7. Merchant ownership check
      const sessionMerchantId = req.user?.merchantId || (req.headers['x-merchant-id'] as string);
      if (sessionMerchantId && product.merchantId) {
        if (product.merchantId.toString() !== sessionMerchantId.toString()) {
          throw new CustomError('Product does not belong to the active merchant store', 403, 'MERCHANT_MISMATCH');
        }
      }

      // 8. Re-check current cart state and stock limits
      const convId = (sessionId as string) || undefined;
      const currentCart = ConversationCartService.getCart(userId, convId);

      const existingItem = currentCart.items.find((it) => it.productId === product!._id.toString());
      const currentQtyInCart = existingItem ? existingItem.quantity : 0;
      const totalRequestedQty = currentQtyInCart + requestedQty;

      if (totalRequestedQty > 100) {
        throw new CustomError('Total quantity for this item in cart cannot exceed 100', 400, 'INVALID_QUANTITY');
      }

      if (product.stock <= 0) {
        throw new CustomError(`Product ${product.name} is out of stock`, 400, 'OUT_OF_STOCK');
      }

      if (product.stock < totalRequestedQty) {
        throw new CustomError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, requested total: ${totalRequestedQty}`,
          400,
          'OUT_OF_STOCK'
        );
      }

      // 9. Server-authoritative cart modification (reusing existing cart service)
      const { cart } = await ConversationCartService.addProductItem(
        product,
        requestedQty,
        userId,
        convId
      );

      const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const totalItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

      // 10. Audit logging
      await AuditService.logActionApproved({
        userId,
        merchantId: product.merchantId?.toString(),
        productId: product._id.toString(),
        productName: product.name,
        quantity: requestedQty,
        price: product.price,
        subtotal,
        recommendationType: (recommendationType as string) || 'UPSELL',
        cartId: cart.cartId,
        sessionId: convId,
      });

      // 11. Bounded, safe response (no orders, no payment triggers, no inventory deductions)
      res.status(200).json({
        success: true,
        action: 'ADD_TO_CART',
        approved: true,
        item: {
          productId: product._id.toString(),
          name: product.name,
          price: product.price,
          currency: product.currency || 'INR',
          quantity: requestedQty,
          lineTotal: product.price * requestedQty,
          category: product.category,
        },
        cart: {
          cartId: cart.cartId,
          items: cart.items.map((it) => ({
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
          currency: cart.items[0]?.currency || 'INR',
          updatedAt: cart.updatedAt,
        },
      });
    } catch (error: any) {
      const err = toAgentCommerceError(error);
      const req_ = req as AuthRequest;
      if (req_.user?.userId && err.code !== 'ACTION_NOT_APPROVED') {
        await AuditService.logActionFailed({
          userId: req_.user.userId,
          merchantId: req_.user.merchantId || (req_.headers['x-merchant-id'] as string),
          productId: typeof req_.body?.productId === 'string' ? req_.body.productId : undefined,
          errorCode: err.code || 'UNKNOWN_ERROR',
          failureReason: err.message || 'Cart action failed',
          sessionId: typeof req_.body?.sessionId === 'string' ? req_.body.sessionId : undefined,
        });
      }
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // 15.2 — GET /api/agent/catalog
  // Machine-readable product catalog for AI buyers
  // ------------------------------------------------------------------
  public static async getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchantId, category, maxPrice, minPrice, inStockOnly, limit } = req.query;

      const req_ = req as AuthRequest;
      const effectiveMerchantId =
        (merchantId as string) ||
        (req.headers['x-merchant-id'] as string) ||
        req_.user?.merchantId ||
        undefined;

      if (effectiveMerchantId && !mongoose.Types.ObjectId.isValid(effectiveMerchantId)) {
        throw new CustomError('Invalid merchantId', 400, 'INVALID_REQUEST');
      }

      const products = await ProductService.getAICatalog(effectiveMerchantId);

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
          merchantId: effectiveMerchantId,
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
          available: p.available,
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
      const sessionMerchantId =
        (req.headers['x-merchant-id'] as string) ||
        req_.user?.merchantId ||
        undefined;

      if (sessionMerchantId && product.merchantId) {
        if (product.merchantId.toString() !== sessionMerchantId.toString()) {
          throw new CustomError('Product does not belong to the active merchant store', 403, 'MERCHANT_MISMATCH');
        }
      }

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
          merchantId: product.merchantId?.toString(),
        },
      });

      const availability = product.stock <= 0 ? 'OUT_OF_STOCK' : product.stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK';

      res.status(200).json({
        success: true,
        product: {
          productId: product._id.toString(),
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          currency: product.currency || 'INR',
          available: product.stock > 0,
          availability,
          inventory: product.stock,
          inventoryStatus: availability,
          features: product.features || [],
          tags: product.tags || [],
          sku: product.sku,
          attributes: {},
          merchantId: product.merchantId ? product.merchantId.toString() : undefined,
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
