import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken, requireMerchant } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireMerchant, AuditController.getLogs);

export default router;
