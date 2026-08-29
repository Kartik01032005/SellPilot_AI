import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  productIds: mongoose.Types.ObjectId[];
  discountPercentage: number;
  status: 'draft' | 'recommended' | 'pending_approval' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema<ICampaign> = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'recommended',
        'pending_approval',
        'approved',
        'active',
        'paused',
        'completed',
        'rejected',
      ],
      default: 'draft',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Campaign = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
