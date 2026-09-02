import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Merchant } from '../models';
import { config } from '../config/env';
import { CustomError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role = 'customer', businessName } = req.body;

      if (!name || !email || !password) {
        throw new CustomError('Name, email, and password are required', 400, 'INVALID_REQUEST');
      }

      if (password.length < 6) {
        throw new CustomError('Password must be at least 6 characters', 400, 'INVALID_REQUEST');
      }

      if (role !== 'customer' && role !== 'merchant') {
        throw new CustomError('Registration is limited to customer or merchant accounts', 400, 'INVALID_REQUEST');
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new CustomError('An account with this email already exists', 409, 'USER_EXISTS');
      }

      let merchantId = null;
      if (role === 'merchant') {
        const merchant = new Merchant({
          name,
          email: email.toLowerCase(),
          businessName: businessName || `${name}'s Store`,
        });
        await merchant.save();
        merchantId = merchant._id;
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        role,
        merchantId,
      });
      await user.save();

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          merchantId: merchantId ? merchantId.toString() : undefined,
        },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          merchantId: user.merchantId,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new CustomError('Email and password are required', 400, 'INVALID_REQUEST');
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new CustomError('Invalid email or password', 401, 'UNAUTHORIZED');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new CustomError('Invalid email or password', 401, 'UNAUTHORIZED');
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          merchantId: user.merchantId ? user.merchantId.toString() : undefined,
        },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          merchantId: user.merchantId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new CustomError('Not authenticated', 401, 'UNAUTHORIZED');
      }

      const user = await User.findById(req.user.userId).select('-password').populate('merchantId');
      if (!user) {
        throw new CustomError('User not found', 404, 'NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          merchantId: user.merchantId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
