import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class PaymentController {
  public static async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const { orderId } = req.body;
      if (!orderId) {
        throw new CustomError('orderId is required', 400, 'INVALID_REQUEST');
      }

      const paymentOrder = await PaymentService.createRazorpayOrder(orderId, req.user.userId);

      res.status(200).json({
        success: true,
        orderId: paymentOrder.razorpayOrderId,
        internalOrderId: paymentOrder.orderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

  public static async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const status = await PaymentService.getPaymentStatus(orderId);

      res.status(200).json({
        success: true,
        ...status,
      });
    } catch (error) {
      next(error);
    }
  }
}
