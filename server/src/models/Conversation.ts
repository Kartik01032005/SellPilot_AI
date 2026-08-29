import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  userId?: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  messages: IMessage[];
  language: string;
  mode: 'buyer' | 'merchant';
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    language: {
      type: String,
      default: 'en',
    },
    mode: {
      type: String,
      enum: ['buyer', 'merchant'],
      default: 'buyer',
    },
  },
  {
    timestamps: true,
  }
);

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
