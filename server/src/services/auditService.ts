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
  public static async log(params: CreateAuditLogParams): Promise<IAuditLog | null> {
    if (mongoose.connection.readyState === 0) {
      return null;
    }
    try {
      const metadata = params.metadata || {};
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
