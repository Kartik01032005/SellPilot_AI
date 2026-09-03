import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { Payment, IPayment } from '../models/Payment';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { config } from '../config/env';
import { CustomError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class PaymentService {
  private static getRazorpayInstance(): Razorpay {
    if (!config.razorpay.isTestMode || !config.razorpay.keySecret) {
      throw new CustomError(
        'Razorpay Test Mode credentials are required. Live payment credentials are not supported.',
        503,
        'PAYMENT_UNAVAILABLE'
      );
    }
    return new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  public static async createRazorpayOrder(
    orderId: string,
    userId: string
  ): Promise<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    correlationId?: string;
  }> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.userId.toString() !== userId) {
      throw new CustomError('Not authorized to create payment for this order', 403, 'FORBIDDEN');
    }

    if (order.status === 'paid' || order.status === 'completed') {
      throw new CustomError('Order is already paid', 400, 'DUPLICATE_OPERATION');
    }

    // Verify inventory availability before creating payment order
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive || product.stock < item.quantity) {
        throw new CustomError(
          `Product ${item.name || 'in order'} is no longer available in requested quantity`,
          400,
          'OUT_OF_STOCK'
        );
      }
    }

    // Check if an active payment record already exists
    let payment = await Payment.findOne({
      orderId: order._id,
      status: { $in: ['created', 'pending'] },
    });

    let rzpOrderId: string;

    if (payment && payment.razorpayOrderId) {
      rzpOrderId = payment.razorpayOrderId;
    } else {
      const razorpay = this.getRazorpayInstance();
      const amountInPaise = Math.round(order.totalAmount * 100);

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: order.currency || 'INR',
        receipt: `rcpt_${order._id.toString().substring(0, 10)}`,
        notes: {
          orderId: order._id.toString(),
          userId: userId,
        },
      });
      rzpOrderId = rzpOrder.id;

      payment = new Payment({
        orderId: order._id,
        userId: new mongoose.Types.ObjectId(userId),
        merchantId: order.merchantId,
        razorpayOrderId: rzpOrderId,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'created',
        verificationStatus: 'unverified',
        correlationId: order.correlationId,
      });
      await payment.save();

      order.razorpayOrderId = rzpOrderId;
      order.status = 'payment_pending';
      order.paymentId = payment._id;
      await order.save();
    }

    await AuditService.log({
      userId,
      merchantId: order.merchantId,
      action: 'payment_order_created',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      amount: order.totalAmount,
      status: 'pending',
      metadata: { razorpayOrderId: rzpOrderId, correlationId: order.correlationId },
      eventType: 'payment_order_created',
      actorType: 'buyer_agent',
      actorId: userId,
      correlationId: order.correlationId,
    });

    return {
      orderId: order._id.toString(),
      razorpayOrderId: rzpOrderId,
      amount: order.totalAmount,
      currency: order.currency,
      correlationId: order.correlationId,
    };
  }

  public static async verifyPayment(
    input: VerifyPaymentInput,
    userId?: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    status: string;
    orderId: string;
  }> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new CustomError(
        'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
        400,
        'INVALID_REQUEST'
      );
    }

    let payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      throw new CustomError('Payment transaction not found', 404, 'NOT_FOUND');
    }

    if (payment.razorpayOrderId !== razorpayOrderId) {
      throw new CustomError('Payment callback does not match the current Razorpay order', 400, 'PAYMENT_ORDER_MISMATCH');
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw new CustomError('Associated order not found', 404, 'NOT_FOUND');
    }

    if (userId && order.userId && order.userId.toString() !== userId) {
      throw new CustomError('Not authorized to verify this payment', 403, 'FORBIDDEN');
    }

    // Verify HMAC SHA256 signature
    let isValid = false;
    if (config.razorpay.isTestMode && config.razorpay.keySecret && razorpaySignature.length === 64) {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      isValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature)
      );
    }

    if (!isValid) {
      payment.status = 'failed';
      payment.verificationStatus = 'failed';
      await payment.save();

      order.status = 'failed';
      await order.save();

      await AuditService.log({
        userId: userId || (payment.userId ? payment.userId.toString() : undefined),
        merchantId: payment.merchantId,
        action: 'payment_verification_failed',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        amount: payment.amount,
        status: 'failed',
        metadata: { razorpayOrderId, razorpayPaymentId },
        eventType: 'payment_verification_failed',
        actorType: 'buyer_agent',
        actorId: userId,
        correlationId: order.correlationId,
      });

      throw new CustomError('Payment verification failed: invalid signature', 400, 'PAYMENT_NOT_VERIFIED');
    }

    // Confirm with Razorpay that this callback identifies a real payment for this order.
    let razorpayPayment: { order_id?: string; status?: string; amount?: number; currency?: string };
    try {
      const razorpay = this.getRazorpayInstance();
      razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId) as typeof razorpayPayment;
    } catch {
      throw new CustomError('Payment verification failed: Razorpay payment could not be confirmed', 400, 'PAYMENT_NOT_VERIFIED');
    }

    const expectedAmount = Math.round(payment.amount * 100);
    const paymentIsForCurrentOrder = razorpayPayment.order_id === razorpayOrderId;
    const paymentIsSettled = razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized';
    const paymentAmountMatches = razorpayPayment.amount === expectedAmount;
    const paymentCurrencyMatches = !razorpayPayment.currency || razorpayPayment.currency === payment.currency;
    if (!paymentIsForCurrentOrder || !paymentIsSettled || !paymentAmountMatches || !paymentCurrencyMatches) {
      throw new CustomError('Payment verification failed: Razorpay payment is not valid for this order', 400, 'PAYMENT_NOT_VERIFIED');
    }

    // Duplicate Operation Protection: only return idempotently after callback and server verification.
    if (payment.status === 'paid' && payment.verificationStatus === 'verified') {
      return {
        success: true,
        verified: true,
        status: 'paid',
        orderId: order._id.toString(),
      };
    }

    // Claim the verification once so concurrent Razorpay callbacks cannot both deduct stock.
    const claimedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: { $in: ['created', 'pending'] },
        verificationStatus: 'unverified',
      },
      { $set: { status: 'pending' } },
      { new: true }
    );
    if (!claimedPayment) {
      const latestPayment = await Payment.findById(payment._id);
      if (latestPayment?.status === 'paid' && latestPayment.verificationStatus === 'verified') {
        return {
          success: true,
          verified: true,
          status: 'paid',
          orderId: order._id.toString(),
        };
      }
      throw new CustomError('Payment verification is already in progress or has been completed', 409, 'DUPLICATE_OPERATION');
    }
    payment = claimedPayment;

    // Reserve inventory only after a valid signature and before marking payment paid.
    payment.razorpayPaymentId = razorpayPaymentId;
    const deductedItems: IOrderItem[] = [];
    for (const item of order.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        for (const deductedItem of deductedItems) {
          await Product.findByIdAndUpdate(deductedItem.productId, {
            $inc: { stock: deductedItem.quantity },
          });
        }
        payment.status = 'failed';
        payment.verificationStatus = 'failed';
        await payment.save();
        order.status = 'failed';
        await order.save();
        await AuditService.log({
          userId: userId || payment.userId.toString(),
          merchantId: payment.merchantId,
          action: 'inventory_reservation_failed',
          eventType: 'inventory_reservation_failed',
          actorType: 'buyer_agent',
          actorId: userId,
          correlationId: order.correlationId,
          entityType: 'Order',
          entityId: order._id.toString(),
          amount: payment.amount,
          status: 'failed',
          metadata: { orderNumber: order.orderNumber, failedProduct: item.name },
        });
        throw new CustomError(
          `Insufficient inventory for ${item.name || 'an order item'}`,
          409,
          'OUT_OF_STOCK'
        );
      }
      deductedItems.push(item);
    }

    payment.status = 'paid';
    payment.verificationStatus = 'verified';
    await payment.save();

    // Update order status & timestamps
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentId = payment._id;
    order.razorpayPaymentId = razorpayPaymentId;
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: 'paid',
      timestamp: new Date(),
      comment: `Payment verified successfully (Razorpay ID: ${razorpayPaymentId})`,
    });
    await order.save();

    await AuditService.log({
      userId: userId || (payment.userId ? payment.userId.toString() : undefined),
      merchantId: payment.merchantId,
      action: 'payment_verified',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      amount: payment.amount,
      status: 'success',
      metadata: {
        orderNumber: order.orderNumber,
        razorpayOrderId,
        razorpayPaymentId,
        orderId: order._id.toString(),
      },
      eventType: 'payment_verified',
      actorType: 'buyer_agent',
      actorId: userId,
      correlationId: order.correlationId,
    });

    return {
      success: true,
      verified: true,
      status: 'paid',
      orderId: order._id.toString(),
    };
  }

  public static async recordPaymentFailure(
    razorpayOrderId: string,
    userId?: string,
    reason?: string
  ): Promise<{
    success: boolean;
    status: string;
    orderId: string;
  }> {
    if (!razorpayOrderId) {
      throw new CustomError('razorpayOrderId is required', 400, 'INVALID_REQUEST');
    }

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      throw new CustomError('Payment transaction not found', 404, 'NOT_FOUND');
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      throw new CustomError('Associated order not found', 404, 'NOT_FOUND');
    }

    if (userId && order.userId.toString() !== userId) {
      throw new CustomError('Not authorized to update this payment', 403, 'FORBIDDEN');
    }

    if (payment.status !== 'paid') {
      payment.status = 'failed';
      payment.verificationStatus = 'failed';
      await payment.save();
    }

    if (order.status !== 'paid' && order.status !== 'completed' && order.status !== 'cancelled') {
      order.status = 'failed';
      await order.save();
    }

    await AuditService.log({
      userId,
      merchantId: payment.merchantId,
      action: 'payment_failed',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      amount: payment.amount,
      status: 'failed',
      eventType: 'payment_failed',
      actorType: 'buyer_agent',
      actorId: userId,
      correlationId: order.correlationId,
      metadata: { razorpayOrderId, reason },
    });

    return {
      success: true,
      status: 'failed',
      orderId: order._id.toString(),
    };
  }

  public static async cancelPayment(
    orderId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
  }> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', 404, 'NOT_FOUND');
    }

    if (userId && order.userId.toString() !== userId) {
      throw new CustomError('Not authorized to cancel this payment', 403, 'FORBIDDEN');
    }

    if (order.status === 'paid' || order.status === 'completed') {
      throw new CustomError('Cannot cancel an already completed payment', 400, 'INVALID_STATE');
    }

    const payment = await Payment.findOne({ orderId: order._id, status: { $in: ['created', 'pending'] } });
    if (payment) {
      payment.status = 'cancelled';
      await payment.save();
    }

    await AuditService.log({
      userId,
      merchantId: order.merchantId,
      action: 'payment_cancelled',
      entityType: 'Order',
      entityId: order._id.toString(),
      status: 'rejected',
      eventType: 'payment_cancelled',
      actorType: 'buyer_agent',
      actorId: userId,
      correlationId: order.correlationId,
    });

    return {
      success: true,
      status: 'cancelled',
      message: 'Payment cancelled successfully',
    };
  }

  public static async getPaymentStatus(
    orderId: string,
    userId: string,
    role: string,
    merchantId?: string
  ): Promise<{
    status: string;
    verified: boolean;
    amount?: number;
    currency?: string;
  }> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });
    if (!payment) {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new CustomError('Order not found', 404, 'NOT_FOUND');
      }
      if (
        role !== 'admin' &&
        order.userId.toString() !== userId &&
        order.merchantId?.toString() !== merchantId
      ) {
        throw new CustomError('Not authorized to view this payment', 403, 'FORBIDDEN');
      }
      return { status: order.status, verified: order.status === 'paid' };
    }

    const order = await Order.findById(orderId).select('userId merchantId').exec();
    if (
      order &&
      role !== 'admin' &&
      order.userId.toString() !== userId &&
      order.merchantId?.toString() !== merchantId
    ) {
      throw new CustomError('Not authorized to view this payment', 403, 'FORBIDDEN');
    }

    return {
      status: payment.status,
      verified: payment.verificationStatus === 'verified',
      amount: payment.amount,
      currency: payment.currency,
    };
  }
}
