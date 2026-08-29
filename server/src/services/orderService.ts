import mongoose from 'mongoose';
import { Order, IOrder, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { CustomError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface PrepareCheckoutInput {
  items: CreateOrderItemInput[];
  discountPercentage?: number;
}

export class OrderService {
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
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new CustomError(`Invalid product ID: ${item.productId}`, 400, 'INVALID_REQUEST');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new CustomError('Item quantity must be greater than 0', 400, 'INVALID_REQUEST');
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

  public static async createOrder(
    userId: string,
    input: PrepareCheckoutInput
  ): Promise<IOrder> {
    const checkout = await this.calculateCheckout(input);

    const order = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      merchantId: checkout.merchantId,
      items: checkout.items,
      totalAmount: checkout.total,
      currency: checkout.currency,
      status: 'pending',
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
        itemCount: checkout.items.length,
        total: checkout.total,
      },
    });

    return savedOrder;
  }

  public static async getOrderById(orderId: string, userId?: string, role?: string): Promise<IOrder> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new CustomError('Invalid order ID', 400, 'INVALID_REQUEST');
    }

    const order = await Order.findById(orderId).populate('items.productId', 'name sku category').exec();
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

  public static async getUserOrders(userId: string): Promise<IOrder[]> {
    return await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  public static async getMerchantOrders(merchantId: string): Promise<IOrder[]> {
    return await Order.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
