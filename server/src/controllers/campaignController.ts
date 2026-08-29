import { Request, Response, NextFunction } from 'express';
import { CampaignService } from '../services/campaignService';
import { AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

export class CampaignController {
  public static async createCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const { name, description, productIds, discountPercentage } = req.body;
      const campaign = await CampaignService.createCampaign({
        merchantId,
        name,
        description,
        productIds,
        discountPercentage,
        createdBy: req.user?.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMerchantCampaigns(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const campaigns = await CampaignService.getMerchantCampaigns(merchantId);

      res.status(200).json({
        success: true,
        count: campaigns.length,
        campaigns,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCampaignById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.user?.userId;
      const campaign = await CampaignService.getCampaignById(id, merchantId);

      res.status(200).json({
        success: true,
        campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async approveCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId || !req.user) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const campaign = await CampaignService.approveCampaign(id, merchantId, req.user.userId);

      res.status(200).json({
        success: true,
        status: campaign.status,
        message: 'Campaign approved successfully',
        campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async activateCampaign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId || !req.user) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const campaign = await CampaignService.activateCampaign(id, merchantId, req.user.userId);

      res.status(200).json({
        success: true,
        status: campaign.status,
        message: 'Campaign activated successfully',
        campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async validateDiscount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.user?.userId;
      if (!merchantId) {
        throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
      }

      const { discountPercentage } = req.body;
      if (discountPercentage === undefined) {
        throw new CustomError('discountPercentage is required', 400, 'INVALID_REQUEST');
      }

      const result = await CampaignService.validateDiscount(merchantId, Number(discountPercentage));

      if (!result.allowed) {
        res.status(400).json({
          success: false,
          allowed: false,
          maxAllowed: result.maxAllowed,
          message: result.message || 'Discount exceeds the configured merchant limit.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        allowed: true,
        discountPercentage: Number(discountPercentage),
        maxAllowed: result.maxAllowed,
      });
    } catch (error) {
      next(error);
    }
  }
}
