import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { PaymentService } from '../services/paymentService';
import { AuditService } from '../services/auditService';

export class OrderController {
  public static async prepareCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, discountPercentage } = req.body;
      const checkout = await OrderService.calculateCheckout({ items, discountPercentage });

      res.status(200).json({
        success: true,
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        total: checkout.total,
        currency: checkout.currency,
        items: checkout.items,
        checkout: {
          subtotal: checkout.subtotal,
          discount: checkout.discount,
          total: checkout.total,
          currency: checkout.currency,
          itemCount: checkout.items.length,
          items: checkout.items,
        },
      });
    } catch (error) {
      const requestError = error as { message?: string; code?: string };
      await AuditService.log({
        action: 'checkout_validation_failed',
        eventType: 'checkout_validation_failed',
        status: 'failed',
        correlationId: typeof req.headers['x-correlation-id'] === 'string'
          ? req.headers['x-correlation-id']
          : undefined,
        metadata: {
          code: requestError.code || 'CHECKOUT_VALIDATION_FAILED',
          reason: requestError.message || 'Checkout validation failed',
        },
      });
      next(error);
    }
  }

  public static async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const { items, discountPercentage, shippingAddress, idempotencyKey, idempotencyFingerprint, correlationId } = req.body;
      const order = await OrderService.createOrder(req.user.userId, {
        items,
        discountPercentage,
        shippingAddress,
        idempotencyKey,
        idempotencyFingerprint,
        correlationId,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(
        id,
        req.user?.userId,
        req.user?.role,
        req.user?.merchantId
      );

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const { reason } = req.body;

      const order = await OrderService.cancelOrder(
        id,
        req.user.userId,
        req.user.role,
        reason,
        req.user.merchantId
      );

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyOrderPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const result = await PaymentService.verifyPayment(
        {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
        req.user?.userId
      );

      res.status(200).json({
        success: true,
        verified: result.verified,
        status: result.status,
        orderId: result.orderId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const orders = await OrderService.getUserOrders(req.user.userId);

      res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTimeline(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }
      const order = await OrderService.getOrderById(
        req.params.id,
        req.user.userId,
        req.user.role,
        req.user.merchantId
      );
      const logs = order.correlationId
        ? await AuditService.getLogs({ correlationId: order.correlationId, limit: 100 })
        : [];
      res.status(200).json({
        success: true,
        orderId: order._id,
        correlationId: order.correlationId,
        events: logs.map((log) => ({
          id: log._id,
          eventType: log.eventType || log.action,
          action: log.action,
          actorType: log.actorType || 'system',
          status: log.status,
          timestamp: log.timestamp,
          entityType: log.entityType,
          entityId: log.entityId,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}
