import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { CustomError } from '../middleware/errorHandler';

export interface ProductFilterParams {
  merchantId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  available?: boolean;
}

export interface CreateProductInput {
  merchantId?: string | mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency?: string;
  stock?: number;
  sku?: string;
  features?: string[];
  tags?: string[];
  relatedProducts?: (string | mongoose.Types.ObjectId)[];
  isActive?: boolean;
}

export class ProductService {
  public static async createProduct(input: CreateProductInput): Promise<IProduct> {
    if (!input.name || !input.category || input.price === undefined) {
      throw new CustomError('Name, category, and price are required', 400, 'INVALID_REQUEST');
    }

    if (input.price < 0) {
      throw new CustomError('Price cannot be negative', 400, 'INVALID_REQUEST');
    }

    if (input.stock !== undefined && input.stock < 0) {
      throw new CustomError('Stock cannot be negative', 400, 'INVALID_REQUEST');
    }

    const product = new Product({
      ...input,
      currency: input.currency || 'INR',
      stock: input.stock !== undefined ? input.stock : 0,
      features: input.features || [],
      tags: input.tags || [],
      relatedProducts: input.relatedProducts || [],
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    return await product.save();
  }

  public static async getProducts(filters: ProductFilterParams): Promise<IProduct[]> {
    const query: Record<string, unknown> = { isActive: true };

    if (filters.merchantId) {
      query.merchantId = filters.merchantId;
    }

    if (filters.category) {
      query.category = { $regex: new RegExp(`^${filters.category}$`, 'i') };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        (query.price as Record<string, number>).$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        (query.price as Record<string, number>).$lte = Number(filters.maxPrice);
      }
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
        { features: { $in: [new RegExp(filters.search, 'i')] } },
      ];
    }

    if (filters.available === true) {
      query.stock = { $gt: 0 };
    }

    return await Product.find(query).sort({ createdAt: -1 }).exec();
  }

  public static async getProductById(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const product = await Product.findById(id).populate('relatedProducts', 'name price category stock').exec();
    if (!product || !product.isActive) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    return product;
  }

  public static async updateProduct(
    id: string,
    merchantId: string,
    updates: Partial<CreateProductInput>
  ): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    if (product.merchantId && product.merchantId.toString() !== merchantId) {
      throw new CustomError('Not authorized to update this product', 403, 'FORBIDDEN');
    }

    if (updates.price !== undefined && updates.price < 0) {
      throw new CustomError('Price cannot be negative', 400, 'INVALID_REQUEST');
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      throw new CustomError('Stock cannot be negative', 400, 'INVALID_REQUEST');
    }

    Object.assign(product, updates);
    return await product.save();
  }

  public static async deleteProduct(id: string, merchantId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new CustomError('Invalid product ID', 400, 'INVALID_REQUEST');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new CustomError('Product not found', 404, 'NOT_FOUND');
    }

    if (product.merchantId && product.merchantId.toString() !== merchantId) {
      throw new CustomError('Not authorized to delete this product', 403, 'FORBIDDEN');
    }

    product.isActive = false;
    await product.save();
    return true;
  }

  public static async validateStock(productId: string, quantity: number): Promise<{
    available: boolean;
    product: IProduct;
  }> {
    const product = await this.getProductById(productId);
    const available = product.stock >= quantity && product.stock > 0;
    return { available, product };
  }

  public static async getAICatalog(merchantId?: string) {
    const query: Record<string, unknown> = { isActive: true };
    if (merchantId) query.merchantId = merchantId;

    const products = await Product.find(query).populate('relatedProducts', '_id name').exec();

    return products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      price: p.price,
      currency: p.currency || 'INR',
      available: p.stock > 0,
      inventory: p.stock,
      features: p.features,
      relatedProducts: p.relatedProducts.map((rel: any) =>
        rel._id ? rel._id.toString() : rel.toString()
      ),
    }));
  }
}
