import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Merchant } from '../models/Merchant';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

export interface SeedProductDef {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  sku: string;
  features: string[];
  tags: string[];
  relatedSkus?: string[];
}

export const DEMO_CATALOG: SeedProductDef[] = [
  {
    name: 'Pro Carbon Running Shoes',
    description: 'Ultra-lightweight marathon running shoes with responsive carbon-plate energy return.',
    category: 'Shoes',
    price: 2999,
    currency: 'INR',
    stock: 15,
    sku: 'SHOE-PRO-CARBON',
    features: ['Carbon-plate', 'Breathable Mesh', 'High Rebound Cushioning'],
    tags: ['running', 'shoes', 'marathon', 'athletics'],
    relatedSkus: ['ACC-SOCK-COMP', 'SHOE-ULTRA-GRIP'],
  },
  {
    name: 'Ultra Grip Road Running Shoes',
    description: 'Durable all-weather road running shoes engineered with maximum impact protection.',
    category: 'Shoes',
    price: 2499,
    currency: 'INR',
    stock: 5,
    sku: 'SHOE-ULTRA-GRIP',
    features: ['All-Weather Grip', 'Dual-Density Foam', 'Reflective Strips'],
    tags: ['running', 'road', 'shoes'],
    relatedSkus: ['ACC-SOCK-COMP', 'SHOE-PRO-CARBON'],
  },
  {
    name: 'Performance Compression Sports Socks (3-Pack)',
    description: 'Moisture-wicking anti-blister athletic socks designed to accompany running shoes.',
    category: 'Accessories',
    price: 499,
    currency: 'INR',
    stock: 45,
    sku: 'ACC-SOCK-COMP',
    features: ['Anti-Blister', 'Arch Support', 'Moisture-Wicking'],
    tags: ['socks', 'compression', 'sports'],
    relatedSkus: ['SHOE-PRO-CARBON'],
  },
  {
    name: 'Pro Slim Ultrabook 14"',
    description: 'Thin and lightweight laptop powered by 16GB RAM and fast SSD storage.',
    category: 'Laptops',
    price: 48999,
    currency: 'INR',
    stock: 6,
    sku: 'LAP-SLIM-14',
    features: ['16GB RAM', '512GB SSD', '14" FHD Display', 'Backlit Keyboard'],
    tags: ['laptop', 'ultrabook', 'computer'],
    relatedSkus: ['ACC-BAG-WATER', 'ELEC-HEAD-ANC'],
  },
  {
    name: 'Executive Waterproof Laptop Bag',
    description: 'Padded shockproof laptop briefcase with organizer compartments.',
    category: 'Accessories',
    price: 1899,
    currency: 'INR',
    stock: 20,
    sku: 'ACC-BAG-WATER',
    features: ['Waterproof Fabric', 'Shock-Resistant Padding', 'Luggage Strap'],
    tags: ['bag', 'laptop bag', 'accessory'],
    relatedSkus: ['LAP-SLIM-14'],
  },
  {
    name: 'Active Noise Cancelling Wireless Headphones',
    description: 'Premium over-ear Bluetooth headphones with 40-hour battery life.',
    category: 'Electronics',
    price: 3499,
    currency: 'INR',
    stock: 18,
    sku: 'ELEC-HEAD-ANC',
    features: ['Active Noise Cancelling', '40h Battery', 'Bluetooth 5.3'],
    tags: ['headphones', 'wireless', 'audio'],
    relatedSkus: ['LAP-SLIM-14', 'PHN-GAME-5G'],
  },
  {
    name: 'Pro Gaming Smartphone 5G',
    description: 'Flagship mobile gaming phone with 120Hz AMOLED display and liquid cooling.',
    category: 'Phones',
    price: 32999,
    currency: 'INR',
    stock: 10,
    sku: 'PHN-GAME-5G',
    features: ['120Hz AMOLED', 'Snapdragon 8 Gen', '5000mAh Battery'],
    tags: ['phone', 'mobile', '5G', 'gaming'],
    relatedSkus: ['ELEC-HEAD-ANC', 'ACC-SCR-PROT'],
  },
  {
    name: '4K Cinema Mirrorless Camera',
    description: 'Professional 4K vlogging and cinema camera with fast phase autofocus.',
    category: 'Cameras',
    price: 64999,
    currency: 'INR',
    stock: 4,
    sku: 'CAM-4K-CINEMA',
    features: ['4K 60FPS', 'Optical Stabilization', 'Flip Touchscreen'],
    tags: ['camera', 'dslr', 'video'],
    relatedSkus: ['ACC-BAG-WATER'],
  },
  {
    name: 'Breathable Dri-FIT Athletic Jersey',
    description: 'Moisture-wicking athletic training shirt engineered for performance and comfort.',
    category: 'Clothing',
    price: 899,
    currency: 'INR',
    stock: 25,
    sku: 'CLO-DRIFIT-JRSY',
    features: ['Dri-FIT Fabric', 'Ergonomic Fit', 'Anti-Odor'],
    tags: ['clothing', 'jersey', 'sports'],
    relatedSkus: ['SHOE-PRO-CARBON', 'ACC-SOCK-COMP'],
  },
  {
    name: 'Ultra-Clear Tempered Screen Protector (2-Pack)',
    description: 'Ultra-tough 9H hardness oleophobic tempered glass for smartphones.',
    category: 'Accessories',
    price: 299,
    currency: 'INR',
    stock: 49,
    sku: 'ACC-SCR-PROT',
    features: ['9H Hardness', 'Oleophobic Coating', 'Bubble-Free Install'],
    tags: ['screen protector', 'tempered glass', 'accessories'],
    relatedSkus: ['PHN-GAME-5G'],
  },
  {
    name: 'RGB Mechanical Gaming Keyboard',
    description: 'Tactile mechanical gaming keyboard with customizable per-key RGB lighting.',
    category: 'Electronics',
    price: 4299,
    currency: 'INR',
    stock: 12,
    sku: 'ELEC-KEY-RGB',
    features: ['Mechanical Switches', 'Per-Key RGB', 'Detachable Type-C Cable'],
    tags: ['keyboard', 'gaming', 'electronics'],
    relatedSkus: ['LAP-SLIM-14'],
  },
  {
    name: 'Ergonomic Trail Running Shorts',
    description: 'Lightweight double-layer compression athletic running shorts with phone pocket.',
    category: 'Clothing',
    price: 699,
    currency: 'INR',
    stock: 30,
    sku: 'CLO-RUN-SHORTS',
    features: ['Inner Compression Liner', 'Zipper Phone Pocket', 'Quick-Dry'],
    tags: ['shorts', 'running', 'clothing'],
    relatedSkus: ['SHOE-PRO-CARBON', 'CLO-DRIFIT-JRSY'],
  },
  {
    name: 'QA Pro Running Carbon X',
    description: 'Verified catalog item.',
    category: 'Shoes',
    price: 2999,
    currency: 'INR',
    stock: 48,
    sku: 'QA-SHOE-CARBON-X-01',
    features: [],
    tags: ['qa', 'running', 'shoes'],
  },
  {
    name: 'QA Pro Running Carbon X',
    description: 'Verified catalog item.',
    category: 'Shoes',
    price: 2999,
    currency: 'INR',
    stock: 48,
    sku: 'QA-SHOE-CARBON-X-02',
    features: [],
    tags: ['qa', 'running', 'shoes'],
  },
];

export class SeedService {
  public static async seedCatalogIfEmpty(merchantId?: string): Promise<{ seededCount: number; totalCount: number }> {
    if (mongoose.connection.readyState === 0 || config.isProduction) {
      return { seededCount: 0, totalCount: 0 };
    }

    try {
      let merchant = merchantId && mongoose.Types.ObjectId.isValid(merchantId)
        ? await Merchant.findById(merchantId)
        : null;

      if (!merchant) {
        // The CLI restore uses the demo merchant; authenticated callers pass their merchant ID.
        let merchantUser = await User.findOne({ email: 'merchant@sellpilot.ai' });
        if (!merchantUser) {
          const hashedPassword = await bcrypt.hash('merchant123', 10);
          merchantUser = await User.create({
            name: 'Apex Sports & Tech Store',
            email: 'merchant@sellpilot.ai',
            password: hashedPassword,
            role: 'merchant',
          });
        }

        merchant = await Merchant.findOne({ email: 'merchant@sellpilot.ai' });
        if (!merchant) {
          merchant = await Merchant.create({
            name: 'Apex Sports & Tech Store',
            email: 'merchant@sellpilot.ai',
            businessName: 'Apex Store',
            currency: 'INR',
            maxDiscountPercentage: 25,
            maxTransactionAmount: 100000,
            approvalRequired: false,
          });
        }

        if (!merchantUser.merchantId || merchantUser.merchantId.toString() !== merchant._id.toString()) {
          merchantUser.merchantId = merchant._id;
          await merchantUser.save();
        }
      }

      let seededCount = 0;
      const skuToDocMap: Map<string, any> = new Map();

      // Ensure all demo products exist
      for (const def of DEMO_CATALOG) {
        let existing = await Product.findOne({ merchantId: merchant._id, sku: def.sku });

        if (!existing) {
          existing = await Product.create({
            merchantId: merchant._id,
            name: def.name,
            description: def.description,
            category: def.category,
            price: def.price,
            currency: def.currency,
            stock: def.stock,
            sku: def.sku,
            features: def.features,
            tags: def.tags,
            isActive: true,
          });
          seededCount++;
        } else {
          // If existing is marked inactive or 0 stock, revive for demo
          if (!existing.isActive || existing.stock <= 0) {
            existing.isActive = true;
            existing.stock = Math.max(existing.stock, def.stock);
            await existing.save();
          }
        }

        skuToDocMap.set(def.sku, existing);
      }

      // Link related products
      for (const def of DEMO_CATALOG) {
        if (def.relatedSkus && def.relatedSkus.length > 0) {
          const mainDoc = skuToDocMap.get(def.sku);
          if (mainDoc) {
            const relatedIds: mongoose.Types.ObjectId[] = [];
            for (const rSku of def.relatedSkus) {
              const relDoc = skuToDocMap.get(rSku);
              if (relDoc) {
                relatedIds.push(relDoc._id);
              }
            }
            if (relatedIds.length > 0) {
              mainDoc.relatedProducts = relatedIds;
              await mainDoc.save();
            }
          }
        }
      }

      const totalCount = await Product.countDocuments({ merchantId: merchant._id, isActive: true });
      console.log(`[SeedService] Catalog status: ${seededCount} new products seeded, total ${totalCount} active products.`);
      return { seededCount, totalCount };
    } catch (err) {
      console.error('[SeedService] Error during catalog restore:', err);
      throw err;
    }
  }
}
