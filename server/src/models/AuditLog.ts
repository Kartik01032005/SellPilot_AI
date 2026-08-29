import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  status: 'success' | 'failed' | 'pending' | 'rejected';
  amount?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'rejected'],
      required: true,
      default: 'success',
    },
    amount: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
