import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class OrderController {
  public static async prepareCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, discountPercentage } = req.body;
      const checkout = await OrderService.calculateCheckout({ items, discountPercentage });

      res.status(200).json({
        success: true,
        checkout: {
          subtotal: checkout.subtotal,
          discount: checkout.discount,
          total: checkout.total,
          currency: checkout.currency,
          itemCount: checkout.items.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const { items, discountPercentage } = req.body;
      const order = await OrderService.createOrder(req.user.userId, { items, discountPercentage });

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
      const order = await OrderService.getOrderById(id, req.user?.userId, req.user?.role);

      res.status(200).json({
        success: true,
        order,
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
}
