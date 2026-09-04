import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export interface CreateAuditLogParams {
  userId?: string | mongoose.Types.ObjectId;
  merchantId?: string | mongoose.Types.ObjectId;
  action: string;
  eventType?: string;
  actorType?: 'buyer' | 'buyer_agent' | 'merchant' | 'merchant_agent' | 'system';
  actorId?: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
  status?: 'success' | 'failed' | 'pending' | 'rejected';
  amount?: number;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  public static sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeyPatterns = [
      'password',
      'token',
      'jwt',
      'secret',
      'authorization',
      'apikey',
      'api_key',
      'razorpay',
      'keysecret',
      'key_secret',
      'card',
      'cvv',
      'creditcard',
    ];

    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
      if (sensitiveKeyPatterns.some((pattern) => normalizedKey.includes(pattern))) {
        continue;
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        clean[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  public static async log(params: CreateAuditLogParams): Promise<IAuditLog | null> {
    const isMocked = (AuditLog.prototype.save as any)?._isMockFunction || (AuditLog as any)?._isMockFunction;
    if (mongoose.connection.readyState === 0 && !isMocked) {
      return null;
    }
    try {
      const rawMetadata = params.metadata || {};
      const metadata = this.sanitizeMetadata(rawMetadata);
      const metadataActorType = metadata.agentType === 'ai_buyer'
        ? 'buyer_agent'
        : metadata.agentType === 'merchant_agent'
          ? 'merchant_agent'
          : undefined;
      const log = new AuditLog({
        userId: params.userId,
        merchantId: params.merchantId,
        action: params.action,
        eventType: params.eventType || params.action,
        actorType: params.actorType || metadataActorType,
        actorId: params.actorId || (params.userId ? params.userId.toString() : undefined),
        correlationId: params.correlationId || (typeof metadata.correlationId === 'string' ? metadata.correlationId : undefined),
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status || 'success',
        amount: params.amount,
        metadata,
        timestamp: new Date(),
      });
      return await log.save();
    } catch (error) {
      console.error('[AuditService] Failed to create audit log:', error);
      return null;
    }
  }

  public static async logRecommendationGenerated(params: {
    userId?: string;
    merchantId?: string;
    recommendationsCount: number;
    productIds: string[];
    recommendationTypes: string[];
    currentCartTotal?: number;
    correlationId?: string;
  }): Promise<IAuditLog | null> {
    return this.log({
      userId: params.userId,
      merchantId: params.merchantId,
      action: 'AGENT_RECOMMENDATION_GENERATED',
      eventType: 'RECOMMENDATION_GENERATED',
      actorType: 'buyer_agent',
      status: 'success',
      correlationId: params.correlationId,
      metadata: {
        recommendationsCount: params.recommendationsCount,
        productIds: params.productIds,
        recommendationTypes: params.recommendationTypes,
        currentCartTotal: params.currentCartTotal,
      },
    });
  }

  public static async logRecommendationRejected(params: {
    userId?: string;
    merchantId?: string;
    reason: string;
    correlationId?: string;
    cartItemsCount?: number;
  }): Promise<IAuditLog | null> {
    return this.log({
      userId: params.userId,
      merchantId: params.merchantId,
      action: 'AGENT_RECOMMENDATION_REJECTED',
      eventType: 'RECOMMENDATION_REJECTED',
      actorType: 'buyer_agent',
      status: 'rejected',
      correlationId: params.correlationId,
      metadata: {
        reason: params.reason,
        cartItemsCount: params.cartItemsCount,
      },
    });
  }

  public static async logActionApproved(params: {
    userId: string;
    merchantId?: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    recommendationType?: string;
    cartId: string;
    sessionId?: string;
  }): Promise<IAuditLog | null> {
    return this.log({
      userId: params.userId,
      merchantId: params.merchantId,
      action: 'AGENT_APPROVED_ADD_TO_CART',
      eventType: 'CART_ACTION_APPROVED',
      actorType: 'buyer',
      status: 'success',
      amount: params.price * params.quantity,
      entityType: 'cart',
      entityId: params.cartId,
      metadata: {
        productId: params.productId,
        productName: params.productName,
        quantity: params.quantity,
        price: params.price,
        subtotal: params.subtotal,
        recommendationType: params.recommendationType || 'UPSELL',
        sessionId: params.sessionId,
      },
    });
  }

  public static async logActionRejected(params: {
    userId: string;
    merchantId?: string;
    productId?: string;
    reason: string;
    sessionId?: string;
  }): Promise<IAuditLog | null> {
    return this.log({
      userId: params.userId,
      merchantId: params.merchantId,
      action: 'AGENT_ACTION_REJECTED',
      eventType: 'USER_DISAPPROVAL',
      actorType: 'buyer',
      status: 'rejected',
      entityType: params.productId ? 'product' : undefined,
      entityId: params.productId,
      metadata: {
        productId: params.productId,
        reason: params.reason,
        sessionId: params.sessionId,
      },
    });
  }

  public static async logActionFailed(params: {
    userId?: string;
    merchantId?: string;
    productId?: string;
    errorCode: string;
    failureReason: string;
    sessionId?: string;
  }): Promise<IAuditLog | null> {
    return this.log({
      userId: params.userId,
      merchantId: params.merchantId,
      action: 'AGENT_ACTION_FAILED',
      eventType: 'CART_ACTION_FAILED',
      actorType: 'buyer_agent',
      status: 'failed',
      entityType: params.productId ? 'product' : undefined,
      entityId: params.productId,
      metadata: {
        productId: params.productId,
        errorCode: params.errorCode,
        failureReason: params.failureReason,
        sessionId: params.sessionId,
      },
    });
  }

  public static async getLogs(filter: {
    merchantId?: string;
    userId?: string;
    action?: string;
    eventType?: string;
    correlationId?: string;
    limit?: number;
  }): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {};
    if (filter.merchantId) query.merchantId = filter.merchantId;
    if (filter.userId) query.userId = filter.userId;
    if (filter.action) query.action = filter.action;
    if (filter.eventType) query.eventType = filter.eventType;
    if (filter.correlationId) query.correlationId = filter.correlationId;

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(filter.limit || 50)
      .exec();
  }
}
