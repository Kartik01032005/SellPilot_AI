import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversationService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class ConversationController {
  public static async createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mode, language, message } = req.body;
      const conversation = await ConversationService.createConversation({
        userId: req.user?.userId,
        merchantId: req.user?.merchantId,
        mode: mode || 'buyer',
        language: language || 'en',
        initialMessage: message ? { role: 'user', content: message } : undefined,
      });

      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getConversationById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversation = await ConversationService.getConversationById(
        id,
        req.user?.userId,
        req.user?.merchantId
      );

      res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const conversations = await ConversationService.getUserConversations(req.user.userId);

      res.status(200).json({
        success: true,
        count: conversations.length,
        conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, content } = req.body;

      if (!role || !content) {
        throw new CustomError('role and content are required', 400, 'INVALID_REQUEST');
      }

      const updated = await ConversationService.addMessage(
        id,
        role,
        content,
        req.user?.userId,
        req.user?.merchantId
      );

      res.status(200).json({
        success: true,
        conversation: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
