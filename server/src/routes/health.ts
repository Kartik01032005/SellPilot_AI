import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Returns service health status as specified in docs/API.md
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sellpilot-api',
  });
});

export default router;
