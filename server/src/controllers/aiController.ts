import { Response, NextFunction } from 'express';
import { AgentService } from '../services/agentService';
import { IntentService } from '../services/intentService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class AIController {
  /**
   * POST /api/ai/chat
   * Main conversational commerce endpoint
   */
  public static async chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, mode = 'buyer', language = 'en', conversationId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        throw new CustomError('Message is required', 400, 'INVALID_REQUEST');
      }

      const result = await AgentService.processChatMessage({
        message: message.trim(),
        mode,
        language,
        conversationId,
        userId: req.user?.userId,
        merchantId: req.user?.merchantId || (mode === 'merchant' ? req.user?.userId : undefined),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/intent
   * Extract intent and structured requirements for testing/tooling
   */
  public static async detectIntent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, mode = 'buyer' } = req.body;

      if (!message || typeof message !== 'string') {
        throw new CustomError('Message is required', 400, 'INVALID_REQUEST');
      }

      const intentResult = IntentService.processMessage(message, mode);

      res.status(200).json({
        success: true,
        ...intentResult,
      });
    } catch (error) {
      next(error);
    }
  }
}
