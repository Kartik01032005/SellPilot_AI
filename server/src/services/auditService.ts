import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export interface CreateAuditLogParams {
  userId?: string | mongoose.Types.ObjectId;
  merchantId?: string | mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  status?: 'success' | 'failed' | 'pending' | 'rejected';
  amount?: number;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<IAuditLog | null> {
    try {
      const log = new AuditLog({
        userId: params.userId,
        merchantId: params.merchantId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status || 'success',
        amount: params.amount,
        metadata: params.metadata || {},
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
    limit?: number;
  }): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {};
    if (filter.merchantId) query.merchantId = filter.merchantId;
    if (filter.userId) query.userId = filter.userId;
    if (filter.action) query.action = filter.action;

    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(filter.limit || 50)
      .exec();
  }
}
