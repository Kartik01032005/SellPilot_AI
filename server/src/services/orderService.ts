import mongoose from 'mongoose';
import { Order, IOrder, IOrderItem, OrderStatus, IShippingAddress } from '../models/Order';
import { Product } from '../models/Product';
import { Payment } from '../models/Payment';
import { CustomError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface PrepareCheckoutInput {
  items: CreateOrderItemInput[];
  discountPercentage?: number;
  shippingAddress?: IShippingAddress;
}

export class OrderService {
  /**
   * Generates a unique, readable order reference number.
   * Format: SP-ORD-YYYYMMDD-XXXXX (e.g. SP-ORD-20260901-7F2A9)
   */
  public static generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `SP-ORD-${dateStr}-${randPart}`;
  }

  /**
   * Validates allowable order status transitions.
   */
  public static isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    if (currentStatus === newStatus) return true;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['payment_pending', 'cancelled'],
      payment_pending: ['paid', 'failed', 'cancelled'],
      paid: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
      failed: [],    // Terminal state
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Server-side calculation and catalog verification of checkout items.
   */
  public static async calculateCheckout(input: PrepareCheckoutInput): Promise<{
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    items: IOrderItem[];
    merchantId?: mongoose.Types.ObjectId;
  }> {
    if (!input.items || input.items.length === 0) {
      throw new CustomError('Order must contain at least one item', 400, 'INVALID_REQUEST');
    }

    let subtotal = 0;
    let currency = 'INR';
    let merchantId: mongoose.Types.ObjectId | undefined;
    const validatedItems: IOrderItem[] = [];

    for (const item of input.items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new CustomError(`Invalid product ID: ${item.productId}`, 400, 'INVALID_REQUEST');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new CustomError('Item quantity must be greater than 0', 400, 'INVALID_REQUEST');
      }

      if (mongoose.connection.readyState === 0) {
        throw new CustomError(`Product not found or inactive: ${item.productId}`, 404, 'PRODUCT_UNAVAILABLE');
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        throw new CustomError(`Product not found or inactive: ${item.productId}`, 404, 'PRODUCT_UNAVAILABLE');
      }

      if (product.stock < item.quantity) {
        throw new CustomError(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
          400,
          'OUT_OF_STOCK'
        );
      }

      subtotal += product.price * item.quantity;
      currency = product.currency || 'INR';
      if (product.merchantId) {
        merchantId = product.merchantId;
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const discountPercentage = Math.min(Math.max(input.discountPercentage || 0, 0), 100);
    const discount = Math.round((subtotal * discountPercentage) / 100);
    const total = Math.max(subtotal - discount, 0);

    return {
      subtotal,
      discount,
      total,
      currency,
      items: validatedItems,
      merchantId,
    };
  }

  /**
   * Creates a production-grade order in 'pending' status without premature inventory deduction.
   */
  public static async createOrder(
    userId: string,
    input: PrepareCheckoutInput
  ): Promise<IOrder> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new CustomError('Valid userId is required to create an order', 400, 'INVALID_REQUEST');
    }

    const checkout = await this.calculateCheckout(input);
    const orderNumber = this.generateOrderNumber();

    const order = new Order({
      orderNumber,
      userId: new mongoose.Types.ObjectId(userId),
      merchantId: checkout.merchantId,
      items: checkout.items,
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      totalAmount: checkout.total,
      currency: checkout.currency,
      status: 'pending',
      shippingAddress: input.shippingAddress || {
        street: '123 Tech Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          comment: 'Order created in checkout',
        },
      ],
    });

    const savedOrder = await order.save();

    await AuditService.log({
      userId,
      merchantId: checkout.merchantId,
      action: 'order_created',
      entityType: 'Order',
      entityId: savedOrder._id.toString(),
      amount: checkout.total,
      status: 'success',
      metadata: {
        orderNumber,
        itemCount: checkout.items.length,
        total: checkout.total,
      },
    });

    return savedOrder;
  }

  /**
   * Cancels an order with status validation and atomic inventory restock if previously paid/processing.
   */
  public static async cancelOrder(
    orderId: string,
    userId: string,
    role?: string,
    reason?: string
  ): Promise<IOrder> {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', 404, 'NOT_FOUND');
    }

    // Ownership & permission check
    if (role !== 'admin') {
      const isOwner = order.userId.toString() === userId;
      const isMerchant = order.merchantId && order.merchantId.toString() === userId;
      if (!isOwner && !isMerchant) {
        throw new CustomError('Not authorized to cancel this order', 403, 'FORBIDDEN');
      }
    }

    // Status transition validation
    if (!this.isValidStatusTransition(order.status, 'cancelled')) {
      throw new CustomError(
        `Cannot cancel order in '${order.status}' status. Only pending, payment_pending, paid, or processing orders can be cancelled.`,
        400,
        'INVALID_STATE'
      );
    }

    const previousStatus = order.status;

    // If inventory was already deducted (in paid or processing status), atomically restock it
    if (previousStatus === 'paid' || previousStatus === 'processing') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by user request';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      comment: reason || `Cancelled from status: ${previousStatus}`,
    });

    const updatedOrder = await order.save();

    // If there is an associated active payment, cancel it
    const activePayment = await Payment.findOne({
      orderId: order._id,
      status: { $in: ['created', 'pending'] },
    });
    if (activePayment) {
      activePayment.status = 'cancelled';
      await activePayment.save();
    }

    await AuditService.log({
      userId,
      merchantId: order.merchantId,
      action: 'order_cancelled',
      entityType: 'Order',
      entityId: order._id.toString(),
      amount: order.totalAmount,
      status: 'success',
      metadata: {
        orderNumber: order.orderNumber,
        previousStatus,
        restocked: previousStatus === 'paid' || previousStatus === 'processing',
        reason: order.cancellationReason,
      },
    });

    return updatedOrder;
  }

  /**
   * Updates order lifecycle status with transition validation.
   */
  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,
    role?: string,
    comment?: string
  ): Promise<IOrder> {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new CustomError('Order not found', 404, 'NOT_FOUND');
    }

    if (newStatus === 'cancelled') {
      return this.cancelOrder(orderId, userId || order.userId.toString(), role, comment);
    }

    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw new CustomError(
        `Invalid status transition from '${order.status}' to '${newStatus}'`,
        400,
        'INVALID_STATE'
      );
    }

    order.status = newStatus;
    if (newStatus === 'paid') {
      order.paidAt = new Date();
    }
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      comment: comment || `Status updated to ${newStatus}`,
    });

    const updated = await order.save();

    await AuditService.log({
      userId,
      merchantId: order.merchantId,
      action: 'order_status_updated',
      entityType: 'Order',
      entityId: order._id.toString(),
      status: 'success',
      metadata: { orderNumber: order.orderNumber, newStatus },
    });

    return updated;
  }

  /**
   * Retrieves single order by ID with authorization check.
   */
  public static async getOrderById(orderId: string, userId?: string, role?: string): Promise<IOrder> {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId).populate('items.productId', 'name sku category price').exec();
    if (!order) {
      throw new CustomError('Order not found', 404, 'NOT_FOUND');
    }

    if (userId && role !== 'admin') {
      const isOwner = order.userId.toString() === userId;
      const isMerchant = order.merchantId && order.merchantId.toString() === userId;
      if (!isOwner && !isMerchant && role !== 'merchant') {
        throw new CustomError('Not authorized to view this order', 403, 'FORBIDDEN');
      }
    }

    return order;
  }

  /**
   * Retrieves all orders belonging to a specific customer.
   */
  public static async getUserOrders(userId: string): Promise<IOrder[]> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new CustomError('Valid userId is required', 400, 'INVALID_REQUEST');
    }

    return await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Retrieves all orders for a merchant store.
   */
  public static async getMerchantOrders(merchantId: string): Promise<IOrder[]> {
    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new CustomError('Valid merchantId is required', 400, 'INVALID_REQUEST');
    }

    return await Order.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}

