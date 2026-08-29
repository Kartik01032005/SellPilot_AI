import mongoose from 'mongoose';
import { Conversation, IConversation, IMessage } from '../models/Conversation';
import { CustomError } from '../middleware/errorHandler';

export interface CreateConversationInput {
  userId?: string;
  merchantId?: string;
  mode?: 'buyer' | 'merchant';
  language?: string;
  initialMessage?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  };
}

export class ConversationService {
  public static async createConversation(input: CreateConversationInput): Promise<IConversation> {
    const messages: IMessage[] = [];
    if (input.initialMessage) {
      messages.push({
        role: input.initialMessage.role,
        content: input.initialMessage.content,
        timestamp: new Date(),
      });
    }

    const conversation = new Conversation({
      userId: input.userId ? new mongoose.Types.ObjectId(input.userId) : undefined,
      merchantId: input.merchantId ? new mongoose.Types.ObjectId(input.merchantId) : undefined,
      mode: input.mode || 'buyer',
      language: input.language || 'en',
      messages,
    });

    return await conversation.save();
  }

  public static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<IConversation> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new CustomError('Invalid conversation ID', 400, 'INVALID_REQUEST');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new CustomError('Conversation not found', 404, 'NOT_FOUND');
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    return await conversation.save();
  }

  public static async getConversationById(id: string): Promise<IConversation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CustomError('Invalid conversation ID', 400, 'INVALID_REQUEST');
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new CustomError('Conversation not found', 404, 'NOT_FOUND');
    }

    return conversation;
  }

  public static async getUserConversations(userId: string): Promise<IConversation[]> {
    return await Conversation.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(20)
      .exec();
  }
}
