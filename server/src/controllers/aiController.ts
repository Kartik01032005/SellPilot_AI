import { Response, NextFunction } from 'express';
import { AgentService } from '../services/agentService';
import { IntentService } from '../services/intentService';
import { ToolRegistry } from '../services/toolRegistry';
import { ToolExecutionService } from '../services/toolExecutionService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class AIController {
  /**
   * POST /api/ai/chat
   * Main conversational commerce agent endpoint
   */
  public static async chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, mode = 'buyer', language = 'en', conversationId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        throw new CustomError('Message is required', 400, 'INVALID_REQUEST');
      }

      if (mode === 'merchant' && req.user?.role === 'customer') {
        throw new CustomError('Access denied: Customer accounts cannot access merchant mode', 403, 'FORBIDDEN');
      }

      const result = await AgentService.processChatMessage({
        message: message.trim(),
        mode,
        language,
        conversationId,
        userId: req.user?.userId,
        merchantId: req.user?.merchantId || (mode === 'merchant' ? req.user?.userId : undefined),
        userRole: req.user?.role,
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

  /**
   * GET /api/ai/tools
   * Lists all registered agent tools with parameter schemas
   */
  public static async getTools(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const mode = req.query.mode as 'buyer' | 'merchant' | undefined;
      const tools = ToolRegistry.getToolDefinitions(mode);

      res.status(200).json({
        success: true,
        count: tools.length,
        tools,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/tools/execute
   * Direct tool execution endpoint for testing and explicit agent orchestration
   */
  public static async executeTool(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolName, arguments: toolArgs = {} } = req.body;

      if (!toolName || typeof toolName !== 'string') {
        throw new CustomError('toolName is required', 400, 'INVALID_REQUEST');
      }

      const result = await ToolExecutionService.executeTool({
        toolName: toolName.trim(),
        arguments: toolArgs,
        context: {
          userId: req.user?.userId,
          merchantId: req.user?.merchantId || req.user?.userId,
          userRole: req.user?.role,
          conversationId: req.body.conversationId,
          correlationId: req.body.correlationId,
        },
      });

      if (!result.success) {
        const isAuthError =
          result.error?.includes('Forbidden') ||
          result.error?.includes('authentication') ||
          result.error?.includes('requires');
        res.status(isAuthError ? 403 : 400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
