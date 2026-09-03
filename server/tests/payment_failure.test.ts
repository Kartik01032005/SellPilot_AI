import { PaymentService } from '../src/services/paymentService';
import { Payment } from '../src/models/Payment';
import { Order } from '../src/models/Order';
import { Product } from '../src/models/Product';
import { AuditService } from '../src/services/auditService';

jest.mock('../src/models/Payment', () => ({
  Payment: {
    findOne: jest.fn(),
  },
}));

jest.mock('../src/models/Order', () => ({
  Order: {
    findById: jest.fn(),
  },
}));

jest.mock('../src/models/Product', () => ({
  Product: {
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/services/auditService', () => ({
  AuditService: {
    log: jest.fn(),
  },
}));

describe('Razorpay payment failure lifecycle', () => {
  it('marks payment failed without cancelling, paying, or restocking the order', async () => {
    const payment = {
      _id: { toString: () => 'payment-1' },
      orderId: { toString: () => 'order-1' },
      userId: { toString: () => 'user-1' },
      merchantId: undefined,
      amount: 1250,
      status: 'created',
      verificationStatus: 'unverified',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const order = {
      _id: { toString: () => 'order-1' },
      userId: { toString: () => 'user-1' },
      status: 'payment_pending',
      correlationId: 'corr-1',
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Payment.findOne as jest.Mock).mockResolvedValue(payment);
    (Order.findById as jest.Mock).mockResolvedValue(order);

    const result = await PaymentService.recordPaymentFailure(
      'rzp_order_failure',
      'user-1',
      'Payment failed in Razorpay Test Mode'
    );

    expect(result).toEqual({ success: true, status: 'failed', orderId: 'order-1' });
    expect(payment.status).toBe('failed');
    expect(payment.verificationStatus).toBe('failed');
    expect(order.status).toBe('failed');
    expect(order.status).not.toBe('cancelled');
    expect(order.status).not.toBe('paid');
    expect(payment.save).toHaveBeenCalledTimes(1);
    expect(order.save).toHaveBeenCalledTimes(1);
    expect(Product.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(AuditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'payment_failed',
      eventType: 'payment_failed',
    }));
  });
});
