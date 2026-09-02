import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, code = 'INVALID_REQUEST', details?: unknown) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  if (statusCode === 500) {
    console.error('[Error] Unhandled server error:', err);
  }

  const isAgentCommerceRequest = req.originalUrl.startsWith('/api/agent');

  if (isAgentCommerceRequest) {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(err.details ? { details: err.details } : {}),
  });
};
