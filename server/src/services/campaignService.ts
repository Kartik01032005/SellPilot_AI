import mongoose from 'mongoose';
import { Campaign, ICampaign } from '../models/Campaign';
import { Merchant } from '../models/Merchant';
import { Product } from '../models/Product';
import { CustomError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export interface CreateCampaignInput {
  merchantId: string;
  name: string;
  description?: string;
  productIds: string[];
  discountPercentage: number;
  createdBy?: string;
}

export class CampaignService {
  public static async validateDiscount(
    merchantId: string,
    discountPercentage: number
  ): Promise<{ allowed: boolean; maxAllowed: number; message?: string }> {
    const merchant = await Merchant.findById(merchantId);
    const maxAllowed = merchant?.maxDiscountPercentage ?? 25;

    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > maxAllowed) {
      return {
        allowed: false,
        maxAllowed,
        message: `Discount of ${discountPercentage}% exceeds the merchant limit of ${maxAllowed}%.`,
      };
    }

    return {
      allowed: true,
      maxAllowed,
    };
  }

  public static async createCampaign(input: CreateCampaignInput): Promise<ICampaign> {
    if (!input.name || !input.productIds || input.productIds.length === 0) {
      throw new CustomError('Campaign name and at least one product ID are required', 400, 'INVALID_REQUEST');
    }

    if (
      input.discountPercentage === undefined ||
      !Number.isFinite(input.discountPercentage) ||
      input.discountPercentage < 0 ||
      input.discountPercentage > 100
    ) {
      throw new CustomError('Valid discount percentage is required', 400, 'INVALID_REQUEST');
    }

    // Validate discount limit
    const validation = await this.validateDiscount(input.merchantId, input.discountPercentage);
    if (!validation.allowed) {
      throw new CustomError(
        validation.message || 'Discount exceeds configured merchant limit',
        400,
        'DISCOUNT_LIMIT_EXCEEDED'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(input.merchantId)) {
      throw new CustomError('Invalid merchant ID', 400, 'INVALID_REQUEST');
    }
    const merchant = await Merchant.findById(input.merchantId);
    if (!merchant) {
      throw new CustomError('Merchant not found', 404, 'NOT_FOUND');
    }

    // Validate products belong to the merchant
    for (const pid of input.productIds) {
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new CustomError(`Invalid product ID: ${pid}`, 400, 'INVALID_REQUEST');
      }
      const product = await Product.findOne({
        _id: pid,
        merchantId: new mongoose.Types.ObjectId(input.merchantId),
      });
      if (!product) {
        throw new CustomError(`Product not found: ${pid}`, 404, 'NOT_FOUND');
      }
    }

    const initialStatus = merchant?.approvalRequired ? 'pending_approval' : 'approved';

    const campaign = new Campaign({
      merchantId: new mongoose.Types.ObjectId(input.merchantId),
      name: input.name,
      description: input.description || '',
      productIds: input.productIds.map((id) => new mongoose.Types.ObjectId(id)),
      discountPercentage: input.discountPercentage,
      status: initialStatus,
      createdBy: input.createdBy ? new mongoose.Types.ObjectId(input.createdBy) : undefined,
    });

    const savedCampaign = await campaign.save();

    await AuditService.log({
      userId: input.createdBy,
      merchantId: input.merchantId,
      action: 'campaign_created',
      entityType: 'Campaign',
      entityId: savedCampaign._id.toString(),
      status: 'pending',
      metadata: {
        campaignName: input.name,
        discountPercentage: input.discountPercentage,
        status: initialStatus,
      },
    });

    return savedCampaign;
  }

  public static async approveCampaign(
    campaignId: string,
    merchantId: string,
    userId: string
  ): Promise<ICampaign> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      throw new CustomError('Invalid campaign ID', 400, 'INVALID_REQUEST');
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new CustomError('Campaign not found', 404, 'NOT_FOUND');
    }

    if (campaign.merchantId.toString() !== merchantId) {
      throw new CustomError('Not authorized to approve this campaign', 403, 'FORBIDDEN');
    }

    campaign.status = 'approved';
    campaign.approvedBy = new mongoose.Types.ObjectId(userId);
    campaign.approvedAt = new Date();
    const updated = await campaign.save();

    await AuditService.log({
      userId,
      merchantId,
      action: 'campaign_approved',
      entityType: 'Campaign',
      entityId: campaign._id.toString(),
      status: 'success',
      metadata: { campaignName: campaign.name },
    });

    return updated;
  }

  public static async activateCampaign(
    campaignId: string,
    merchantId: string,
    userId: string
  ): Promise<ICampaign> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      throw new CustomError('Invalid campaign ID', 400, 'INVALID_REQUEST');
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new CustomError('Campaign not found', 404, 'NOT_FOUND');
    }

    if (campaign.merchantId.toString() !== merchantId) {
      throw new CustomError('Not authorized to activate this campaign', 403, 'FORBIDDEN');
    }

    if (campaign.status !== 'approved' && campaign.status !== 'active') {
      throw new CustomError('Campaign must be approved before activation', 400, 'APPROVAL_REQUIRED');
    }

    campaign.status = 'active';
    const updated = await campaign.save();

    await AuditService.log({
      userId,
      merchantId,
      action: 'campaign_activated',
      entityType: 'Campaign',
      entityId: campaign._id.toString(),
      status: 'success',
      metadata: { campaignName: campaign.name },
    });

    return updated;
  }

  public static async getMerchantCampaigns(merchantId: string): Promise<ICampaign[]> {
    return await Campaign.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .populate('productIds', 'name price category stock')
      .sort({ createdAt: -1 })
      .exec();
  }

  public static async getCampaignById(campaignId: string, merchantId?: string): Promise<ICampaign> {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      throw new CustomError('Invalid campaign ID', 400, 'INVALID_REQUEST');
    }

    const campaign = await Campaign.findById(campaignId)
      .populate('productIds', 'name price category stock')
      .exec();

    if (!campaign) {
      throw new CustomError('Campaign not found', 404, 'NOT_FOUND');
    }

    if (merchantId && campaign.merchantId.toString() !== merchantId) {
      throw new CustomError('Not authorized to access this campaign', 403, 'FORBIDDEN');
    }

    return campaign;
  }
}
