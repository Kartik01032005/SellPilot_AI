import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  merchantId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: 'upsell' | 'cross_sell' | 'promotion' | 'campaign' | 'product' | 'growth';
  productId?: mongoose.Types.ObjectId;
  recommendedProductIds: mongoose.Types.ObjectId[];
  reason: string;
  confidence?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const RecommendationSchema: Schema<IRecommendation> = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['upsell', 'cross_sell', 'promotion', 'campaign', 'product', 'growth'],
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    recommendedProductIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    reason: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Recommendation =
  mongoose.models.Recommendation ||
  mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
