import { Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class AuditController {
  public static async getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.role === 'admin' ? undefined : req.user?.merchantId || req.user?.userId;
      const { action, limit } = req.query;

      const logs = await AuditService.getLogs({
        merchantId: merchantId ? merchantId.toString() : undefined,
        action: action as string,
        limit: limit ? Number(limit) : 50,
      });

      res.status(200).json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, status, referenceId, details, amount } = req.body;
      if (!action) {
        throw new CustomError('action is required', 400, 'INVALID_REQUEST');
      }

      const log = await AuditService.log({
        userId: req.user?.userId,
        merchantId: req.user?.merchantId,
        action,
        status: status || 'success',
        entityId: referenceId,
        amount,
        metadata: details || {},
      });

      res.status(201).json({
        success: true,
        log,
      });
    } catch (error) {
      next(error);
    }
  }
}
