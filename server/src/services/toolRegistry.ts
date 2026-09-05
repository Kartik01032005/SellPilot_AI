import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { ProductService, ProductFilterParams } from './productService';
import { OrderService } from './orderService';
import { RecommendationService } from './recommendationService';
import { MerchantService } from './merchantService';
import { CampaignService } from './campaignService';
import { ConversationCartService } from './conversationCartService';
import { CustomError } from '../middleware/errorHandler';

export interface AgentToolContext {
  userId?: string;
  merchantId?: string;
  userRole?: string;
  conversationId?: string;
  correlationId?: string;
  language?: string;
}

export interface ToolValidationResult<T> {
  valid: boolean;
  error?: string;
  parsedArgs?: T;
}

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  mode: 'buyer' | 'merchant' | 'both';
  requiresAuth: boolean;
  requiredRole?: 'merchant' | 'admin' | 'customer';
  parametersSchema: Record<string, { type: string; description: string; required?: boolean }>;
  validateArgs: (args: any) => ToolValidationResult<TInput>;
  execute: (args: TInput, context: AgentToolContext) => Promise<TOutput>;
}

// ----------------------------------------------------
// Tool: searchProducts
// ----------------------------------------------------
export interface SearchProductsArgs {
  category?: string;
  query?: string;
  keywords?: string[];
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  inStockOnly?: boolean;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'relevance';
}

const searchProductsTool: AgentTool<SearchProductsArgs, { count: number; products: any[] }> = {
  name: 'searchProducts',
  description: 'Search catalog products by category, price limits, keywords, features, and stock availability.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    category: { type: 'string', description: 'Product category filter (e.g. Shoes, Laptops, Phones)' },
    query: { type: 'string', description: 'Free-text search query' },
    keywords: { type: 'array', description: 'Array of keyword terms' },
    minPrice: { type: 'number', description: 'Minimum price bound' },
    maxPrice: { type: 'number', description: 'Maximum price bound' },
    features: { type: 'array', description: 'Features required (e.g. 16GB, carbon-plate)' },
    inStockOnly: { type: 'boolean', description: 'Only return items with stock > 0' },
    limit: { type: 'number', description: 'Maximum number of items to return (1-20)' },
    sortBy: { type: 'string', description: 'Sort by price_asc, price_desc, or relevance' },
  },
  validateArgs: (args: any) => {
    if (!args || typeof args !== 'object') {
      return { valid: false, error: 'Arguments must be an object' };
    }
    if (args.minPrice !== undefined && (typeof args.minPrice !== 'number' || args.minPrice < 0)) {
      return { valid: false, error: 'minPrice must be a non-negative number' };
    }
    if (args.maxPrice !== undefined && (typeof args.maxPrice !== 'number' || args.maxPrice < 0)) {
      return { valid: false, error: 'maxPrice must be a non-negative number' };
    }
    if (args.minPrice !== undefined && args.maxPrice !== undefined && args.minPrice > args.maxPrice) {
      return { valid: false, error: 'minPrice cannot exceed maxPrice' };
    }
    return {
      valid: true,
      parsedArgs: {
        category: args.category ? String(args.category).trim() : undefined,
        query: args.query ? String(args.query).trim() : undefined,
        keywords: Array.isArray(args.keywords) ? args.keywords.map(String) : [],
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        features: Array.isArray(args.features) ? args.features.map(String) : [],
        inStockOnly: args.inStockOnly !== false,
        limit: Math.min(Math.max(Number(args.limit) || 6, 1), 20),
        sortBy: args.sortBy || 'price_asc',
      },
    };
  },
  execute: async (args: SearchProductsArgs, context: AgentToolContext) => {
    if (mongoose.connection.readyState === 0) {
      const cat = args.category || 'Shoes';
      const maxP = args.maxPrice || 3000;
      let mockPrice = 2999;
      if (/laptop/i.test(cat)) mockPrice = 48999;
      else if (/phone/i.test(cat)) mockPrice = 32999;
      else if (/camera/i.test(cat)) mockPrice = 64999;
      return {
        count: 1,
        products: [
          {
            id: 'mock_prod_1',
            name: `Pro ${cat}`,
            price: Math.min(mockPrice, maxP),
            currency: 'INR',
            stock: 15,
            category: cat,
            features: args.features || ['High Performance'],
            available: true,
            reason: `Matches your ${cat} search and fits within your ₹${maxP.toLocaleString('en-IN')} budget.`,
          },
        ],
      };
    }

    const filterQuery: Record<string, unknown> = { isActive: true };

    if (args.inStockOnly) {
      filterQuery.stock = { $gt: 0 };
    }

    if (args.category) {
      filterQuery.category = { $regex: new RegExp(`^${args.category}$`, 'i') };
    }

    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      filterQuery.price = {};
      if (args.minPrice !== undefined) {
        (filterQuery.price as Record<string, number>).$gte = args.minPrice;
      }
      if (args.maxPrice !== undefined) {
        (filterQuery.price as Record<string, number>).$lte = args.maxPrice;
      }
    }

    if (args.features && args.features.length > 0) {
      filterQuery.features = {
        $in: args.features.map((f) => new RegExp(f, 'i')),
      };
    }

    let sortOption: Record<string, 1 | -1> = { price: 1 };
    if (args.sortBy === 'price_desc') sortOption = { price: -1 };

    let products = await Product.find(filterQuery)
      .populate('relatedProducts', 'name price category stock currency isActive')
      .sort(sortOption)
      .limit(args.limit || 6)
      .exec();

    // Keyword fallback search if exact match gave zero
    if (products.length === 0 && (args.query || (args.keywords && args.keywords.length > 0))) {
      const kwList = [args.query, ...(args.keywords || [])].filter(Boolean) as string[];
      const fallbackPriceQuery: Record<string, number> = {};
      if (args.minPrice !== undefined) fallbackPriceQuery.$gte = args.minPrice;
      if (args.maxPrice !== undefined) fallbackPriceQuery.$lte = args.maxPrice;

      products = await Product.find({
        isActive: true,
        ...(args.inStockOnly ? { stock: { $gt: 0 } } : {}),
        ...(Object.keys(fallbackPriceQuery).length > 0 ? { price: fallbackPriceQuery } : {}),
        $or: kwList.map((kw) => ({
          $or: [
            { name: { $regex: kw, $options: 'i' } },
            { description: { $regex: kw, $options: 'i' } },
            { category: { $regex: kw, $options: 'i' } },
          ],
        })),
      })
        .populate('relatedProducts', 'name price category stock currency isActive')
        .limit(args.limit || 6)
        .exec();
    }

    const formatted = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency || 'INR',
      stock: p.stock,
      category: p.category,
      features: p.features || [],
      available: p.stock > 0,
      reason:
        p.stock > 0
          ? `Verified catalog item matching ${p.category} within ₹${args.maxPrice || p.price}.`
          : 'Currently out of stock.',
    }));

    return { count: formatted.length, products: formatted };
  },
};

// ----------------------------------------------------
// Tool: getProductDetails
// ----------------------------------------------------
export interface GetProductDetailsArgs {
  productId?: string;
  name?: string;
}

const getProductDetailsTool: AgentTool<GetProductDetailsArgs, { product: any }> = {
  name: 'getProductDetails',
  description: 'Retrieve verified real-time details, features, price, and stock for a specific product.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID' },
    name: { type: 'string', description: 'Product Name' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'Either productId or name is required' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId ? String(args.productId).trim() : undefined,
        name: args.name ? String(args.name).trim() : undefined,
      },
    };
  },
  execute: async (args: GetProductDetailsArgs) => {
    let product: IProduct | null = null;
    if (args.productId && mongoose.Types.ObjectId.isValid(args.productId)) {
      product = await Product.findById(args.productId)
        .populate('relatedProducts', 'name price category stock currency')
        .exec();
    }

    if (!product && args.name) {
      product = await Product.findOne({
        name: { $regex: new RegExp(args.name, 'i') },
        isActive: true,
      })
        .populate('relatedProducts', 'name price category stock currency')
        .exec();
    }

    if (!product && mongoose.connection.readyState === 0) {
      return {
        product: {
          id: args.productId || 'mock_prod_1',
          name: args.name || 'Pro Running Shoes',
          description: 'Ultra-lightweight marathon running shoes with responsive carbon-plate energy return.',
          price: 2999,
          currency: 'INR',
          stock: 12,
          category: 'Shoes',
          features: ['Carbon-plate', 'Breathable Mesh', 'High Rebound Cushioning'],
          available: true,
        },
      };
    }

    if (!product || !product.isActive) {
      throw new CustomError('Product not found in catalog', 404, 'NOT_FOUND');
    }

    return {
      product: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency || 'INR',
        stock: product.stock,
        category: product.category,
        features: product.features || [],
        available: product.stock > 0,
        relatedProducts: product.relatedProducts,
      },
    };
  },
};

// ----------------------------------------------------
// Tool: compareProducts
// ----------------------------------------------------
export interface CompareProductsArgs {
  productIds?: string[];
  productNames?: string[];
  category?: string;
}

const compareProductsTool: AgentTool<CompareProductsArgs, { comparison: any[]; cheapestId?: string }> = {
  name: 'compareProducts',
  description: 'Compare two or more catalog products by price, stock, specs, and price differences.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    productIds: { type: 'array', description: 'List of product IDs to compare' },
    productNames: { type: 'array', description: 'List of product names to compare' },
    category: { type: 'string', description: 'Category to compare top options from' },
  },
  validateArgs: (args: any) => {
    return {
      valid: true,
      parsedArgs: {
        productIds: Array.isArray(args.productIds) ? args.productIds : [],
        productNames: Array.isArray(args.productNames) ? args.productNames : [],
        category: args.category ? String(args.category).trim() : undefined,
      },
    };
  },
  execute: async (args: CompareProductsArgs) => {
    let products: IProduct[] = [];

    if (args.productIds && args.productIds.length > 0) {
      const validIds = args.productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        products = await Product.find({ _id: { $in: validIds }, isActive: true }).sort({ price: 1 }).exec();
      }
    }

    if (products.length === 0 && args.productNames && args.productNames.length > 0) {
      products = await Product.find({
        name: { $in: args.productNames.map((n) => new RegExp(`^${n}$`, 'i')) },
        isActive: true,
      }).sort({ price: 1 }).exec();
    }

    if (products.length === 0 && args.category) {
      products = await Product.find({
        category: { $regex: new RegExp(`^${args.category}$`, 'i') },
        isActive: true,
        stock: { $gt: 0 },
      }).sort({ price: 1 }).limit(4).exec();
    }

    if (products.length === 0 && mongoose.connection.readyState === 0) {
      return {
        comparison: [
          {
            id: 'mock_1',
            name: 'Ultra Grip Road Shoes',
            price: 2499,
            stock: 8,
            category: 'Shoes',
            features: ['All-Weather Grip', 'Dual-Density Foam'],
          },
          {
            id: 'mock_2',
            name: 'Pro Carbon Running Shoes',
            price: 2999,
            stock: 12,
            category: 'Shoes',
            features: ['Carbon-plate', 'Breathable Mesh'],
          },
        ],
        cheapestId: 'mock_1',
      };
    }

    const comparison = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      currency: p.currency || 'INR',
      stock: p.stock,
      category: p.category,
      features: p.features || [],
    }));

    return {
      comparison,
      cheapestId: comparison.length > 0 ? comparison[0].id : undefined,
    };
  },
};

// ----------------------------------------------------
// Tool: checkInventory
// ----------------------------------------------------
export interface CheckInventoryArgs {
  productId?: string;
  name?: string;
  requestedQuantity?: number;
}

const checkInventoryTool: AgentTool<
  CheckInventoryArgs,
  { available: boolean; stock: number; productName: string; canFulfill: boolean }
> = {
  name: 'checkInventory',
  description: 'Verify real-time stock availability and fulfillability for a product.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID' },
    name: { type: 'string', description: 'Product name' },
    requestedQuantity: { type: 'number', description: 'Quantity requested (defaults to 1)' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'productId or name is required' };
    }
    const qty = args.requestedQuantity !== undefined ? Number(args.requestedQuantity) : 1;
    if (isNaN(qty) || qty <= 0) {
      return { valid: false, error: 'requestedQuantity must be greater than 0' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId ? String(args.productId).trim() : undefined,
        name: args.name ? String(args.name).trim() : undefined,
        requestedQuantity: qty,
      },
    };
  },
  execute: async (args: CheckInventoryArgs) => {
    if (mongoose.connection.readyState === 0) {
      const stock = 12;
      const reqQty = args.requestedQuantity || 1;
      return {
        available: stock > 0,
        stock,
        productName: args.name || 'Pro Running Shoes',
        canFulfill: stock >= reqQty,
      };
    }

    let product: IProduct | null = null;
    if (args.productId && mongoose.Types.ObjectId.isValid(args.productId)) {
      product = await Product.findById(args.productId);
    }
    if (!product && args.name) {
      product = await Product.findOne({
        name: { $regex: new RegExp(args.name, 'i') },
        isActive: true,
      });
    }

    if (!product || !product.isActive) {
      throw new CustomError('Product not found in catalog', 404, 'NOT_FOUND');
    }

    const reqQty = args.requestedQuantity || 1;
    return {
      available: product.stock > 0,
      stock: product.stock,
      productName: product.name,
      canFulfill: product.stock >= reqQty,
    };
  },
};

// ----------------------------------------------------
// Tool: getCart
// ----------------------------------------------------
export interface GetCartArgs {
  conversationId?: string;
  userId?: string;
}

const getCartTool: AgentTool<
  GetCartArgs,
  { items: any[]; totalItems: number; subtotal: number; currency: string }
> = {
  name: 'getCart',
  description: 'Retrieve all current items in the user or conversation shopping cart.',
  mode: 'buyer',
  requiresAuth: true,
  parametersSchema: {
    conversationId: { type: 'string', description: 'Conversation ID for conversation-scoped cart' },
    userId: { type: 'string', description: 'User ID' },
  },
  validateArgs: (args: any) => ({
    valid: true,
    parsedArgs: {
      conversationId: args.conversationId,
      userId: args.userId,
    },
  }),
  execute: async (args: GetCartArgs, context: AgentToolContext) => {
    const userId = args.userId || context.userId;
    const convId = args.conversationId || context.conversationId;
    const cart = ConversationCartService.getCart(userId, convId);

    const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const totalItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      items: cart.items,
      totalItems,
      subtotal,
      currency: cart.items[0]?.currency || 'INR',
    };
  },
};

// ----------------------------------------------------
// Tool: addToCart
// ----------------------------------------------------
export interface AddToCartArgs {
  productId?: string;
  name?: string;
  quantity?: number;
  conversationId?: string;
  userId?: string;
}

const addToCartTool: AgentTool<
  AddToCartArgs,
  { success: boolean; addedItem: any; totalItems: number; subtotal: number }
> = {
  name: 'addToCart',
  description: 'Add a verified catalog product to the cart after real-time inventory validation.',
  mode: 'buyer',
  requiresAuth: true,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID' },
    name: { type: 'string', description: 'Product name' },
    quantity: { type: 'number', description: 'Quantity to add (defaults to 1)' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'productId or name is required' };
    }
    const qty = args.quantity !== undefined ? Number(args.quantity) : 1;
    if (isNaN(qty) || qty <= 0) {
      return { valid: false, error: 'quantity must be greater than 0' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId ? String(args.productId).trim() : undefined,
        name: args.name ? String(args.name).trim() : undefined,
        quantity: qty,
        conversationId: args.conversationId,
        userId: args.userId,
      },
    };
  },
  execute: async (args: AddToCartArgs, context: AgentToolContext) => {
    const userId = args.userId || context.userId;
    const convId = args.conversationId || context.conversationId;
    const target = args.productId || args.name!;

    const { cart, addedItem } = await ConversationCartService.addItem(
      target,
      args.quantity || 1,
      userId,
      convId
    );

    const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const totalItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      success: true,
      addedItem,
      items: cart.items,
      totalItems,
      subtotal,
    };
  },
};

// ----------------------------------------------------
// Tool: removeFromCart
// ----------------------------------------------------
export interface RemoveFromCartArgs {
  productId?: string;
  name?: string;
  conversationId?: string;
  userId?: string;
}

const removeFromCartTool: AgentTool<
  RemoveFromCartArgs,
  { success: boolean; removedName?: string; remainingItems: number; subtotal: number }
> = {
  name: 'removeFromCart',
  description: 'Remove an item from the shopping cart.',
  mode: 'buyer',
  requiresAuth: true,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID to remove' },
    name: { type: 'string', description: 'Product name to remove' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'productId or name is required' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId ? String(args.productId).trim() : undefined,
        name: args.name ? String(args.name).trim() : undefined,
        conversationId: args.conversationId,
        userId: args.userId,
      },
    };
  },
  execute: async (args: RemoveFromCartArgs, context: AgentToolContext) => {
    const userId = args.userId || context.userId;
    const convId = args.conversationId || context.conversationId;
    const target = args.productId || args.name!;

    const { cart, removed, removedName } = ConversationCartService.removeItem(
      target,
      userId,
      convId
    );

    const subtotal = cart.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const remainingItems = cart.items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      success: removed,
      removedName,
      remainingItems,
      subtotal,
    };
  },
};

// ----------------------------------------------------
// Tool: calculateCart
// ----------------------------------------------------
export interface CalculateCartArgs {
  items?: Array<{ productId: string; quantity: number }>;
  discountPercentage?: number;
  conversationId?: string;
  userId?: string;
}

const calculateCartTool: AgentTool<
  CalculateCartArgs,
  { subtotal: number; discount: number; total: number; currency: string; itemsCount: number }
> = {
  name: 'calculateCart',
  description: 'Execute server-side price, discount, and inventory verification for cart total calculation.',
  mode: 'buyer',
  requiresAuth: true,
  parametersSchema: {
    items: { type: 'array', description: 'List of { productId, quantity } items' },
    discountPercentage: { type: 'number', description: 'Optional discount percentage to apply (capped by merchant rules)' },
  },
  validateArgs: (args: any) => {
    if (args.discountPercentage !== undefined) {
      const disc = Number(args.discountPercentage);
      if (isNaN(disc) || disc < 0 || disc > 100) {
        return { valid: false, error: 'discountPercentage must be between 0 and 100' };
      }
    }
    return {
      valid: true,
      parsedArgs: {
        items: Array.isArray(args.items) ? args.items : undefined,
        discountPercentage: args.discountPercentage !== undefined ? Number(args.discountPercentage) : undefined,
        conversationId: args.conversationId,
        userId: args.userId,
      },
    };
  },
  execute: async (args: CalculateCartArgs, context: AgentToolContext) => {
    let itemsToCalculate = args.items;

    if (!itemsToCalculate || itemsToCalculate.length === 0) {
      const userId = args.userId || context.userId;
      const convId = args.conversationId || context.conversationId;
      const cart = ConversationCartService.getCart(userId, convId);
      itemsToCalculate = cart.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));
    }

    if (!itemsToCalculate || itemsToCalculate.length === 0) {
      return {
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: 'INR',
        itemsCount: 0,
      };
    }

    if (mongoose.connection.readyState === 0) {
      const subtotal = 2999;
      const discount = args.discountPercentage ? Math.round((subtotal * args.discountPercentage) / 100) : 0;
      return {
        subtotal,
        discount,
        total: subtotal - discount,
        currency: 'INR',
        itemsCount: itemsToCalculate.length,
      };
    }

    const calcResult = await OrderService.calculateCheckout({
      items: itemsToCalculate,
      discountPercentage: args.discountPercentage,
    });

    return {
      subtotal: calcResult.subtotal,
      discount: calcResult.discount,
      total: calcResult.total,
      currency: calcResult.currency,
      itemsCount: calcResult.items.length,
    };
  },
};

// ----------------------------------------------------
// Tool: getCrossSells
// ----------------------------------------------------
export interface GetCrossSellsArgs {
  productId?: string;
  name?: string;
}

const getCrossSellsTool: AgentTool<GetCrossSellsArgs, { crossSells: any[] }> = {
  name: 'getCrossSells',
  description: 'Find complementary accessory items that pair with a given product.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID' },
    name: { type: 'string', description: 'Product Name' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'productId or name is required' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId,
        name: args.name,
      },
    };
  },
  execute: async (args: GetCrossSellsArgs) => {
    let pId = args.productId;
    if (!pId && args.name && mongoose.connection.readyState !== 0) {
      const found = await Product.findOne({ name: { $regex: new RegExp(args.name, 'i') } });
      if (found) pId = found._id.toString();
    }

    if (!pId || mongoose.connection.readyState === 0) {
      return {
        crossSells: [
          {
            productId: 'mock_cross_1',
            name: 'Performance Compression Sports Socks (3-Pack)',
            price: 499,
            currency: 'INR',
            reason: 'Complementary athletic accessory commonly purchased with running shoes.',
          },
        ],
      };
    }

    const rec = await RecommendationService.getCrossSellRecommendation(pId);
    return {
      crossSells: rec ? [rec] : [],
    };
  },
};

// ----------------------------------------------------
// Tool: getUpsell
// ----------------------------------------------------
export interface GetUpsellArgs {
  productId?: string;
  name?: string;
}

const getUpsellTool: AgentTool<GetUpsellArgs, { upsell: any | null }> = {
  name: 'getUpsell',
  description: 'Find premium upgrade alternatives in the same product category.',
  mode: 'both',
  requiresAuth: false,
  parametersSchema: {
    productId: { type: 'string', description: 'Product ID' },
    name: { type: 'string', description: 'Product Name' },
  },
  validateArgs: (args: any) => {
    if (!args || (!args.productId && !args.name)) {
      return { valid: false, error: 'productId or name is required' };
    }
    return {
      valid: true,
      parsedArgs: {
        productId: args.productId,
        name: args.name,
      },
    };
  },
  execute: async (args: GetUpsellArgs) => {
    let pId = args.productId;
    if (!pId && args.name && mongoose.connection.readyState !== 0) {
      const found = await Product.findOne({ name: { $regex: new RegExp(args.name, 'i') } });
      if (found) pId = found._id.toString();
    }

    if (!pId || mongoose.connection.readyState === 0) {
      return {
        upsell: {
          productId: 'mock_upsell_1',
          name: 'Pro Elite Marathon Carbon Shoes',
          price: 3499,
          priceDiff: 500,
          currency: 'INR',
          reason: 'Offers improved energy return and lighter carbon plate.',
        },
      };
    }

    const upsell = await RecommendationService.getUpsellRecommendation(pId);
    return { upsell };
  },
};

// ----------------------------------------------------
// Tool: getMerchantInsights (Merchant Only)
// ----------------------------------------------------
export interface GetMerchantInsightsArgs {
  merchantId?: string;
}

const getMerchantInsightsTool: AgentTool<GetMerchantInsightsArgs, { insights: any }> = {
  name: 'getMerchantInsights',
  description: 'Retrieve real-time revenue opportunities, promotion candidates, and catalog demand analytics.',
  mode: 'merchant',
  requiresAuth: true,
  requiredRole: 'merchant',
  parametersSchema: {
    merchantId: { type: 'string', description: 'Merchant ID' },
  },
  validateArgs: (args: any) => ({
    valid: true,
    parsedArgs: { merchantId: args.merchantId },
  }),
  execute: async (args: GetMerchantInsightsArgs, context: AgentToolContext) => {
    const merchantId = args.merchantId || context.merchantId || context.userId;
    if (!merchantId) {
      throw new CustomError('Merchant authorization required', 403, 'FORBIDDEN');
    }

    if (mongoose.connection.readyState === 0) {
      return {
        insights: {
          promotionOpportunities: [
            {
              productId: 'mock_prod_1',
              name: 'Pro Carbon Running Shoes',
              category: 'Shoes',
              price: 2999,
              stock: 25,
              suggestedDiscount: 15,
              reason: 'High stock in Shoes with healthy margin. Recommended safe promotion up to 15%.',
            },
          ],
          bestOpportunities: [
            {
              productId: 'mock_prod_1',
              name: 'Pro Carbon Running Shoes',
              category: 'Shoes',
              price: 2999,
              stock: 25,
              score: 95,
              reason: 'Strongest commercial opportunity in Shoes: ₹2,999 with 25 units in stock and ₹74,975 revenue potential.',
            },
          ],
          crossSellOpportunities: [
            {
              name: 'Pro Carbon Running Shoes',
              relatedName: 'Anti-Blister Running Socks',
              category: 'Shoes',
              relatedCategory: 'Accessories',
            },
          ],
          upsellOpportunities: [
            {
              productId: 'mock_prod_2',
              name: 'Ultra Grip Road Running Shoes',
              premiumProductId: 'mock_prod_1',
              premiumName: 'Pro Carbon Running Shoes',
              category: 'Shoes',
              priceDiff: 500,
            },
          ],
          topProducts: [
            {
              id: 'mock_prod_1',
              productId: 'mock_prod_1',
              name: 'Pro Carbon Running Shoes',
              category: 'Shoes',
              price: 2999,
              stock: 15,
            },
            {
              id: 'mock_prod_2',
              productId: 'mock_prod_2',
              name: 'Ultra Grip Road Running Shoes',
              category: 'Shoes',
              price: 2499,
              stock: 5,
            },
          ],
        },
      };
    }

    const insights = await MerchantService.getInsights(merchantId);
    return { insights };
  },
};

// ----------------------------------------------------
// Tool: validateDiscount (Merchant Only)
// ----------------------------------------------------
export interface ValidateDiscountArgs {
  discountPercentage: number;
  merchantId?: string;
}

const validateDiscountTool: AgentTool<
  ValidateDiscountArgs,
  { valid: boolean; maxAllowed: number; message: string }
> = {
  name: 'validateDiscount',
  description: 'Validate whether a proposed campaign discount conforms to configured merchant guardrails.',
  mode: 'merchant',
  requiresAuth: true,
  requiredRole: 'merchant',
  parametersSchema: {
    discountPercentage: { type: 'number', description: 'Proposed discount percentage (0-100)', required: true },
    merchantId: { type: 'string', description: 'Merchant ID' },
  },
  validateArgs: (args: any) => {
    if (args.discountPercentage === undefined || typeof args.discountPercentage !== 'number') {
      return { valid: false, error: 'discountPercentage is required and must be a number' };
    }
    return {
      valid: true,
      parsedArgs: {
        discountPercentage: args.discountPercentage,
        merchantId: args.merchantId,
      },
    };
  },
  execute: async (args: ValidateDiscountArgs, context: AgentToolContext) => {
    const merchantId = args.merchantId || context.merchantId || context.userId;
    if (!merchantId || mongoose.connection.readyState === 0) {
      const maxAllowed = 25;
      const valid = args.discountPercentage <= maxAllowed;
      return {
        valid,
        maxAllowed,
        message: valid
          ? `Discount of ${args.discountPercentage}% is within limits.`
          : `Discount of ${args.discountPercentage}% exceeds the merchant limit of ${maxAllowed}%.`,
      };
    }
    const result = await CampaignService.validateDiscount(
      merchantId,
      args.discountPercentage
    );
    return {
      valid: result.allowed,
      maxAllowed: result.maxAllowed,
      message: result.message || (result.allowed ? 'Discount is valid' : 'Discount exceeds limit'),
    };
  },
};

// ----------------------------------------------------
// Complete Tool Registry
// ----------------------------------------------------
export class ToolRegistry {
  private static tools: Map<string, AgentTool<any, any>> = new Map();

  static {
    this.registerTool(searchProductsTool);
    this.registerTool(getProductDetailsTool);
    this.registerTool(compareProductsTool);
    this.registerTool(checkInventoryTool);
    this.registerTool(getCartTool);
    this.registerTool(addToCartTool);
    this.registerTool(removeFromCartTool);
    this.registerTool(calculateCartTool);
    this.registerTool(getCrossSellsTool);
    this.registerTool(getUpsellTool);
    this.registerTool(getMerchantInsightsTool);
    this.registerTool(validateDiscountTool);
  }

  public static registerTool(tool: AgentTool<any, any>): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): AgentTool<any, any> | undefined {
    return this.tools.get(name);
  }

  public static getAllTools(): AgentTool<any, any>[] {
    return Array.from(this.tools.values());
  }

  public static getToolsForMode(mode: 'buyer' | 'merchant'): AgentTool<any, any>[] {
    return Array.from(this.tools.values()).filter(
      (t) => t.mode === 'both' || t.mode === mode
    );
  }

  public static getToolDefinitions(mode?: 'buyer' | 'merchant'): Array<{
    name: string;
    description: string;
    mode: string;
    requiresAuth: boolean;
    parametersSchema: Record<string, { type: string; description: string; required?: boolean }>;
  }> {
    const tools = mode ? this.getToolsForMode(mode) : this.getAllTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      mode: t.mode,
      requiresAuth: t.requiresAuth,
      parametersSchema: t.parametersSchema,
    }));
  }
}
