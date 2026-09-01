import { ToolRegistry, AgentToolContext, AgentTool } from './toolRegistry';
import { AuditService } from './auditService';
import { CustomError } from '../middleware/errorHandler';

export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  context: AgentToolContext;
}

export interface ToolExecutionResponse<T = any> {
  success: boolean;
  toolName: string;
  arguments: Record<string, unknown>;
  data?: T;
  error?: string;
  executionTimeMs: number;
}

export class ToolExecutionService {
  /**
   * Executes a tool with argument validation, authorization enforcement, and error isolation.
   */
  public static async executeTool<T = any>(
    request: ToolExecutionRequest
  ): Promise<ToolExecutionResponse<T>> {
    const startTime = Date.now();
    const tool = ToolRegistry.getTool(request.toolName);

    if (!tool) {
      return {
        success: false,
        toolName: request.toolName,
        arguments: request.arguments,
        error: `Unknown tool: ${request.toolName}. Tool is not registered in the agent registry.`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 1. Authorization & Role Checks
    if (tool.requiresAuth) {
      if (!request.context.userId && !request.context.merchantId) {
        return {
          success: false,
          toolName: request.toolName,
          arguments: request.arguments,
          error: `Tool '${tool.name}' requires authentication.`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      if (tool.requiredRole && request.context.userRole && request.context.userRole !== tool.requiredRole && request.context.userRole !== 'admin') {
        return {
          success: false,
          toolName: request.toolName,
          arguments: request.arguments,
          error: `Forbidden: Tool '${tool.name}' requires ${tool.requiredRole} role.`,
          executionTimeMs: Date.now() - startTime,
        };
      }
    }

    // 2. Argument Validation
    const validation = tool.validateArgs(request.arguments);
    if (!validation.valid) {
      return {
        success: false,
        toolName: request.toolName,
        arguments: request.arguments,
        error: validation.error || `Invalid arguments for tool '${tool.name}'`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 3. Tool Execution with Safe Isolation
    try {
      const data = await tool.execute(validation.parsedArgs || request.arguments, request.context);
      const executionTimeMs = Date.now() - startTime;

      // Sensitive actions are audited
      if (['addToCart', 'removeFromCart', 'validateDiscount', 'getMerchantInsights'].includes(tool.name)) {
        await AuditService.log({
          userId: request.context.userId,
          merchantId: request.context.merchantId,
          action: `agent_tool_${tool.name}`,
          entityType: 'AgentTool',
          status: 'success',
          metadata: {
            toolName: tool.name,
            arguments: request.arguments,
            executionTimeMs,
          },
        });
      }

      return {
        success: true,
        toolName: tool.name,
        arguments: validation.parsedArgs || request.arguments,
        data,
        executionTimeMs,
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof CustomError ? err.message : err.message || 'Tool execution encountered an error';

      await AuditService.log({
        userId: request.context.userId,
        merchantId: request.context.merchantId,
        action: `agent_tool_${tool.name}_error`,
        entityType: 'AgentTool',
        status: 'failed',
        metadata: {
          errorMessage,
          toolName: tool.name,
          arguments: request.arguments,
          executionTimeMs,
        },
      });

      return {
        success: false,
        toolName: tool.name,
        arguments: request.arguments,
        error: errorMessage,
        executionTimeMs,
      };
    }
  }

  /**
   * Executes a sequential batch of tools, passing previous tool outputs to context if needed.
   */
  public static async executeBatch(
    requests: Array<{ toolName: string; arguments: Record<string, unknown> }>,
    context: AgentToolContext
  ): Promise<ToolExecutionResponse[]> {
    const results: ToolExecutionResponse[] = [];
    for (const req of requests) {
      const res = await this.executeTool({
        toolName: req.toolName,
        arguments: req.arguments,
        context,
      });
      results.push(res);
    }
    return results;
  }
}
