import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  comment?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress?: IShippingAddress;
  paymentId?: mongoose.Types.ObjectId;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  idempotencyKey?: string;
  idempotencyFingerprint?: string;
  correlationId?: string;
  actorType?: 'buyer' | 'buyer_agent';
  paidAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
    },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'payment_pending', 'paid', 'processing', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      default: () => ({}),
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
    idempotencyFingerprint: {
      type: String,
      trim: true,
    },
    correlationId: { type: String, index: true, trim: true },
    actorType: { type: String, enum: ['buyer', 'buyer_agent'], default: 'buyer_agent' },
    paidAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    statusHistory: {
      type: [OrderStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

