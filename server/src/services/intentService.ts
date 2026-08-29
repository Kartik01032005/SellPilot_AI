export type BuyerIntent =
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_RECOMMENDATION'
  | 'PRODUCT_COMPARISON'
  | 'PRICE_INQUIRY'
  | 'AVAILABILITY_INQUIRY'
  | 'PRODUCT_DETAILS'
  | 'UPSELL'
  | 'CROSS_SELL'
  | 'PURCHASE_REQUEST'
  | 'PAYMENT_REQUEST'
  | 'PAYMENT_STATUS'
  | 'ORDER_STATUS'
  | 'GENERAL_ASSISTANCE'
  | 'UNKNOWN'
  | 'UNSUPPORTED';

export type MerchantIntent =
  | 'PRODUCT_PERFORMANCE'
  | 'PRODUCT_PROMOTION'
  | 'REVENUE_IMPROVEMENT'
  | 'UPSELL_OPPORTUNITY'
  | 'CROSS_SELL_OPPORTUNITY'
  | 'CAMPAIGN_RECOMMENDATION'
  | 'DISCOUNT_RECOMMENDATION'
  | 'PRODUCT_ANALYSIS'
  | 'CUSTOMER_DEMAND'
  | 'CATALOG_ANALYSIS'
  | 'COMMERCE_PERFORMANCE'
  | 'UNKNOWN'
  | 'UNSUPPORTED';

export interface ExtractedRequirements {
  category?: string;
  keywords: string[];
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  features: string[];
  brand?: string;
  quantity?: number;
  detectedLanguage: string;
  isCheapestRequested?: boolean;
  isBestRequested?: boolean;
  comparisonRequested?: boolean;
}

export interface IntentResult {
  intent: BuyerIntent | MerchantIntent;
  mode: 'buyer' | 'merchant';
  confidence: number;
  requirements: ExtractedRequirements;
  rawMessage: string;
}

export class IntentService {
  private static parsePriceValue(valStr: string): number {
    const clean = valStr.toLowerCase().trim();
    if (clean.endsWith('k')) {
      const num = parseFloat(clean.replace('k', ''));
      return num * 1000;
    }
    if (clean.endsWith('l') || clean.endsWith('lakh')) {
      const num = parseFloat(clean.replace(/lakh|l/g, ''));
      return num * 100000;
    }
    return parseFloat(clean.replace(/[^0-9.]/g, '')) || 0;
  }

  public static extractRequirements(message: string): ExtractedRequirements {
    const text = message.toLowerCase();
    const requirements: ExtractedRequirements = {
      keywords: [],
      currency: 'INR',
      features: [],
      detectedLanguage: 'en',
    };

    // Detect language / Romanized hints
    if (/\b(nanage|beku|kodi|yaavudu|yavudhu|thorsu)\b/i.test(text)) {
      requirements.detectedLanguage = 'kn'; // Kannada
    } else if (/\b(mujhe|chahiye|kya|kaunsa|sasta|batao|karo|bhejo)\b/i.test(text)) {
      requirements.detectedLanguage = 'hi'; // Hindi
    } else if (/\b(enakku|venum|kudu|edhu)\b/i.test(text)) {
      requirements.detectedLanguage = 'ta'; // Tamil
    } else if (/\b(naaku|kavali|ivvandi|edi)\b/i.test(text)) {
      requirements.detectedLanguage = 'te'; // Telugu
    }

    // Price extraction: "under 3000", "under 3k", "below 50000", "< 500", "upto 2500"
    const maxPriceRegex = /(?:under|below|less than|upto|within|max|<=?|₹|rs\.?|inr)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k|\d+)\s*(?:rupees|rs|inr)?\b/gi;
    const underMatch = text.match(/(?:under|below|less than|upto|within|max|<=)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k|\d+)/i);
    if (underMatch && underMatch[1]) {
      requirements.maxPrice = this.parsePriceValue(underMatch[1]);
    } else {
      // Direct number after under/below
      const directUnder = text.match(/under\s+(\d+k|\d+)/i);
      if (directUnder && directUnder[1]) {
        requirements.maxPrice = this.parsePriceValue(directUnder[1]);
      }
    }

    // Min price extraction: "above 2000", "min 1000", "> 500"
    const minMatch = text.match(/(?:above|more than|min|at least|>=?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k|\d+)/i);
    if (minMatch && minMatch[1]) {
      requirements.minPrice = this.parsePriceValue(minMatch[1]);
    }

    // Range: "between 2000 and 5000"
    const rangeMatch = text.match(/between\s*(?:₹|rs\.?|inr)?\s*(\d+k|\d+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+k|\d+)/i);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      requirements.minPrice = this.parsePriceValue(rangeMatch[1]);
      requirements.maxPrice = this.parsePriceValue(rangeMatch[2]);
    }

    // Category extraction
    const categoriesMap: Record<string, string[]> = {
      'Shoes': ['shoe', 'shoes', 'running shoes', 'sneakers', 'boots', 'footwear', 'pro shoes'],
      'Laptops': ['laptop', 'laptops', 'notebook', 'macbook', 'pc', 'pro laptop'],
      'Phones': ['phone', 'phones', 'smartphone', 'mobile', 'iphone', 'android'],
      'Cameras': ['camera', 'cameras', 'dslr', 'lens'],
      'Accessories': ['socks', 'sports socks', 'bag', 'laptop bag', 'case', 'phone case', 'memory card', 'charger', 'cable', 'headphone', 'headphones'],
      'Electronics': ['electronics', 'gadget', 'gadgets', 'tv', 'smartwatch', 'watch', 'monitor'],
      'Clothing': ['shirt', 't-shirt', 'pants', 'trousers', 'jacket', 'jersey'],
    };

    for (const [cat, synonyms] of Object.entries(categoriesMap)) {
      for (const syn of synonyms) {
        if (new RegExp(`\\b${syn}\\b`, 'i').test(text)) {
          requirements.category = cat;
          requirements.keywords.push(syn);
          break;
        }
      }
      if (requirements.category) break;
    }

    // Common features
    const featurePatterns = [
      '16gb', '8gb', '32gb', '128gb', '256gb', '512gb', '1tb',
      'ram', 'ssd', 'cushioned', 'lightweight', 'breathable',
      'waterproof', 'wireless', 'bluetooth', 'noise cancelling',
      'leather', 'cotton', 'gaming'
    ];

    for (const feat of featurePatterns) {
      if (text.includes(feat)) {
        requirements.features.push(feat);
      }
    }

    // Superlative / Modifier hints
    if (/\b(cheapest|sasta|kammi|thakkuva|lowest price|least expensive)\b/i.test(text)) {
      requirements.isCheapestRequested = true;
    }
    if (/\b(best|top|highest rated|premium|popular)\b/i.test(text)) {
      requirements.isBestRequested = true;
    }
    if (/\b(compare|difference|versus|vs|better)\b/i.test(text)) {
      requirements.comparisonRequested = true;
    }

    return requirements;
  }

  public static detectBuyerIntent(message: string): BuyerIntent {
    const text = message.toLowerCase().trim();

    if (!text) {
      return 'UNKNOWN';
    }

    // Payment / Order Status
    if (/\b(payment status|status of payment|transaction status|did my payment go through)\b/i.test(text)) {
      return 'PAYMENT_STATUS';
    }
    if (/\b(order status|where is my order|track order|my orders)\b/i.test(text)) {
      return 'ORDER_STATUS';
    }

    // Checkout / Purchase Request
    if (/\b(buy it|buy this|checkout|order now|proceed to payment|purchase|place order|pay now|yes buy|ready to buy)\b/i.test(text)) {
      return 'PURCHASE_REQUEST';
    }
    if (/\b(pay|payment|make payment|razorpay)\b/i.test(text) && !/\b(status|why)\b/i.test(text)) {
      return 'PAYMENT_REQUEST';
    }

    // Comparison
    if (/\b(compare|which is better|difference between|vs|which is cheaper|which is cheapest|which one should i choose)\b/i.test(text)) {
      return 'PRODUCT_COMPARISON';
    }

    // Availability / Inventory inquiry
    if (/\b(is this available|in stock|out of stock|available|do you have stock)\b/i.test(text)) {
      return 'AVAILABILITY_INQUIRY';
    }

    // Price inquiry
    if (/\b(how much|what is the price|price of|kitne ka hai|bele eshtu|vilai enna|cost of)\b/i.test(text) && !text.includes('under') && !text.includes('below')) {
      return 'PRICE_INQUIRY';
    }

    // Product Details
    if (/\b(details|specs|specifications|features of|tell me more about|more info)\b/i.test(text)) {
      return 'PRODUCT_DETAILS';
    }

    // Upsell inquiry
    if (/\b(upgrade|better option|higher version|pro version|premium alternative)\b/i.test(text)) {
      return 'UPSELL';
    }

    // Cross sell inquiry
    if (/\b(accessory|accessories|related item|goes with|complementary|matching)\b/i.test(text)) {
      return 'CROSS_SELL';
    }

    // Product Recommendation / Search
    if (
      /\b(need|want|find|search|show|looking for|recommend|suggest|give me|chahiye|beku|venum|kavali)\b/i.test(text) ||
      /\b(shoes|laptop|phone|camera|accessories|clothing)\b/i.test(text)
    ) {
      if (/\b(recommend|suggest|what do you recommend|best option)\b/i.test(text)) {
        return 'PRODUCT_RECOMMENDATION';
      }
      return 'PRODUCT_SEARCH';
    }

    // General greetings / assistance
    if (/\b(hello|hi|hey|help|assist|namaste|vanakkam|namaskara)\b/i.test(text)) {
      return 'GENERAL_ASSISTANCE';
    }

    return 'PRODUCT_SEARCH';
  }

  public static detectMerchantIntent(message: string): MerchantIntent {
    const text = message.toLowerCase().trim();

    if (!text) {
      return 'UNKNOWN';
    }

    // Product Promotion / What to promote
    if (
      /\b(what should i promote|which product should i promote|what to advertise|what to sell more|item needs promotion|how can i increase sales|increase revenue|boost sales|promote|promotion|kya promote karu|kaunsa product promote|yavudhu promote|edha promote|denini promote)\b/i.test(text)
    ) {
      return 'PRODUCT_PROMOTION';
    }

    // Revenue Improvement & Opportunities
    if (
      /\b(increase revenue|improve revenue|maximize profit|grow sales|growth opportunity|growth opportunities|revenue opportunities|sales kaise badhaye|sales heg hecchu|sales epdi increase|sales ela penchali)\b/i.test(text)
    ) {
      return 'REVENUE_IMPROVEMENT';
    }

    // Campaign Recommendation
    if (/\b(campaign|marketing campaign|create campaign|recommend campaign|run campaign|ad campaign)\b/i.test(text)) {
      return 'CAMPAIGN_RECOMMENDATION';
    }

    // Discount Recommendation
    if (/\b(discount|give discount|offer discount|how much discount|recommend discount|cut price)\b/i.test(text)) {
      return 'DISCOUNT_RECOMMENDATION';
    }

    // Upsell Opportunity
    if (/\b(upsell|upselling|higher value|upsell opportunity|suggest an upsell|suggest upsell)\b/i.test(text)) {
      return 'UPSELL_OPPORTUNITY';
    }

    // Cross-sell Opportunity / Product bundling
    if (
      /\b(cross-sell|cross selling|cross sell|bundle|complementary products|suggest a cross-sell|suggest cross-sell|which products work well together|work well together|together)\b/i.test(text)
    ) {
      return 'CROSS_SELL_OPPORTUNITY';
    }

    // Product Performance / Sales Analysis
    if (
      /\b(top product|top products|best seller|best selling|low performing|dead stock|inventory report|performance|performing best|best performing|performing well|which product is performing best|sabse accha product|yava product best)\b/i.test(text)
    ) {
      return 'PRODUCT_PERFORMANCE';
    }

    // Customer Demand & Interest
    if (/\b(customer demand|what are customers searching|market demand|customer interest|customers interested in|what products are customers interested in)\b/i.test(text)) {
      return 'CUSTOMER_DEMAND';
    }

    // Catalog Analysis
    if (/\b(catalog|my inventory|stock level|all products|catalog analysis)\b/i.test(text)) {
      return 'CATALOG_ANALYSIS';
    }

    return 'PRODUCT_PROMOTION';
  }

  public static processMessage(message: string, mode: 'buyer' | 'merchant' = 'buyer'): IntentResult {
    const requirements = this.extractRequirements(message);
    const intent = mode === 'merchant' ? this.detectMerchantIntent(message) : this.detectBuyerIntent(message);

    return {
      intent,
      mode,
      confidence: intent !== 'UNKNOWN' ? 0.95 : 0.2,
      requirements,
      rawMessage: message,
    };
  }
}
