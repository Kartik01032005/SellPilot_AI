import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  email: string;
  businessName: string;
  currency: string;
  maxDiscountPercentage: number;
  maxTransactionAmount: number;
  approvalRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema<IMerchant> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    maxDiscountPercentage: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    maxTransactionAmount: {
      type: Number,
      default: 100000,
      min: 0,
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Merchant = mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema);
