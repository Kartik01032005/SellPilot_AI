export type BuyerIntent =
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_RECOMMENDATION'
  | 'PRODUCT_COMPARISON'
  | 'PRICE_INQUIRY'
  | 'AVAILABILITY_INQUIRY'
  | 'PRODUCT_DETAILS'
  | 'UPSELL'
  | 'CROSS_SELL'
  | 'ADD_TO_CART'
  | 'VIEW_CART'
  | 'REMOVE_FROM_CART'
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
  targetOrdinal?: number; // 1 for first, 2 for second, 3 for third, etc.
  targetProductName?: string;
  discountPercentage?: number;
  subIntent?:
    | 'BEST_OPPORTUNITY'
    | 'DISCOUNT_EVALUATION'
    | 'CATEGORY_PROMOTION'
    | 'FOLLOW_UP_REASON'
    | 'FOLLOW_UP_DISCOUNT'
    | 'ALTERNATIVE_PRODUCT_QUERY'
    | 'GENERAL_PROMOTION';
  isFollowUp?: boolean;
  isAlternativeReferenced?: boolean;
}

export interface IntentResult {
  intent: BuyerIntent | MerchantIntent;
  subIntent?: string;
  mode: 'buyer' | 'merchant';
  confidence: number;
  requirements: ExtractedRequirements;
  rawMessage: string;
}

export class IntentService {
  public static parsePriceValue(valStr: string): number {
    if (!valStr) return 0;
    let clean = valStr.toLowerCase().replace(/,/g, '').trim();

    // Map word prefixes e.g. "a", "one", "two", "half"
    if (/^(?:a|one)\s+/i.test(clean)) {
      clean = clean.replace(/^(?:a|one)\s+/i, '1 ');
    } else if (/^two\s+/i.test(clean)) {
      clean = clean.replace(/^two\s+/i, '2 ');
    } else if (/^three\s+/i.test(clean)) {
      clean = clean.replace(/^three\s+/i, '3 ');
    } else if (/^four\s+/i.test(clean)) {
      clean = clean.replace(/^four\s+/i, '4 ');
    } else if (/^five\s+/i.test(clean)) {
      clean = clean.replace(/^five\s+/i, '5 ');
    } else if (/^half\s*(?:a)?\s*/i.test(clean)) {
      clean = clean.replace(/^half\s*(?:a)?\s*/i, '0.5 ');
    } else if (/^(?:a\s+)?(?:lakh|lac)\b/i.test(clean)) {
      clean = '1 ' + clean;
    }

    // Crore multiplier (1 crore = 10,000,000)
    if (/\b(?:cr|crore|crores)\b/i.test(clean) || clean.endsWith('cr')) {
      const match = clean.match(/(\d+(?:\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : 0;
      return isNaN(num) ? 0 : Math.round(num * 10000000);
    }

    // Lakh / Lac multiplier (1 lakh = 100,000)
    if (/\b(?:lakh|lakhs|lac|lacs)\b/i.test(clean) || /(?:\d+(?:\.\d+)?)\s*l\b/i.test(clean)) {
      const match = clean.match(/(\d+(?:\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : 0;
      return isNaN(num) ? 0 : Math.round(num * 100000);
    }

    // Thousand / K multiplier (1 thousand = 1,000)
    if (/\b(?:k|kilo|thousand|thousands|hazar|hazaar|saavira|aayiram|vela)\b/i.test(clean) || clean.endsWith('k')) {
      const match = clean.match(/(\d+(?:\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : 0;
      return isNaN(num) ? 0 : Math.round(num * 1000);
    }

    // Pure number (e.g. "100000", "50000", "2999")
    const match = clean.match(/(\d+(?:\.\d+)?)/);
    const num = match ? parseFloat(match[1]) : 0;
    return isNaN(num) ? 0 : Math.round(num);
  }

  public static extractRequirements(message: string): ExtractedRequirements {
    const text = message.toLowerCase();
    const requirements: ExtractedRequirements = {
      keywords: [],
      currency: 'INR',
      features: [],
      detectedLanguage: 'en',
    };

    // Detect language / Romanized hints & native scripts
    if (/[\u0C80-\u0CFF]|\b(nanage|beku|kodi|yaavudu|yavudhu|thorsu)\b/i.test(text)) {
      requirements.detectedLanguage = 'kn'; // Kannada
    } else if (/[\u0900-\u097F]|\b(mujhe|chahiye|kya|kaunsa|sasta|batao|karo|bhejo)\b/i.test(text)) {
      requirements.detectedLanguage = 'hi'; // Hindi
    } else if (/[\u0B80-\u0BFF]|\b(enakku|venum|kudu|edhu)\b/i.test(text)) {
      requirements.detectedLanguage = 'ta'; // Tamil
    } else if (/[\u0C00-\u0C7F]|\b(naaku|kavali|ivvandi|edi)\b/i.test(text)) {
      requirements.detectedLanguage = 'te'; // Telugu
    }

    // Ordinal extraction: "first one", "second one", "2nd one", "3rd product", "last one"
    if (/\b(first|1st|pehla|modalaneyadhu)\b/i.test(text)) {
      requirements.targetOrdinal = 1;
    } else if (/\b(second|2nd|doosra|eradaneyadhu)\b/i.test(text)) {
      requirements.targetOrdinal = 2;
    } else if (/\b(third|3rd|teesra|mooroneyadhu)\b/i.test(text)) {
      requirements.targetOrdinal = 3;
    } else if (/\b(fourth|4th|chautha)\b/i.test(text)) {
      requirements.targetOrdinal = 4;
    }

    // Quantity extraction: "2 shoes", "quantity 3", "x2" (avoid extracting price components as quantity)
    const qtyMatch = text.match(/\b(?:quantity|qty|count|buy|add)?\s*(\d+)\s*(?:items|units|pcs|pieces|pairs)?\b/i);
    if (
      qtyMatch &&
      qtyMatch[1] &&
      !text.includes('under') &&
      !text.includes('rs') &&
      !text.includes('₹') &&
      !text.includes('lakh') &&
      !text.includes('lac') &&
      !text.includes('thousand') &&
      !text.includes('crore')
    ) {
      const isPriceToken = new RegExp(`\\b${qtyMatch[1]}\\s*(?:lakh|lac|k|thousand|cr|crore)\\b`, 'i').test(text);
      if (!isPriceToken) {
        const parsedQty = parseInt(qtyMatch[1], 10);
        if (parsedQty > 0 && parsedQty <= 50) {
          requirements.quantity = parsedQty;
        }
      }
    }

    // Comprehensive price pattern supporting:
    // "1 lakh", "1.5 lakh", "1lakh", "1 lac", "1lac", "2 lakhs", "1l", "1.5l"
    // "50k", "50 thousand", "1,00,000", "100000", "1 crore", "1cr"
    const PRICE_TOKEN_REGEX =
      '(?:\\d+(?:,\\d+)*(?:\\.\\d+)?\\s*(?:lakhs?|lacs?|crores?|cr|thousands?|hazar|hazaar|saavira|aayiram|vela|k|l)\\b|\\d+(?:,\\d+)*(?:\\.\\d+)?|(?:a|one|two|three|four|five|half(?:\\s+a)?)\\s+(?:lakhs?|lacs?|crores?|cr|thousands?|k)\\b|(?:a\\s+)?(?:lakhs?|lacs?)\\b)';

    // Price extraction: "under 3000", "under 1 lakh", "below 50000", "upto 1.5 lakh", "within 1 lakh"
    const underRegex = new RegExp(
      `(?:under|below|less than|upto|up to|within|max|<=|<|budget\\s*(?:of|is|:)?|around|about|priced at|at most)\\s*(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})`,
      'i'
    );
    const underMatch = text.match(underRegex);
    if (underMatch && underMatch[1]) {
      requirements.maxPrice = this.parsePriceValue(underMatch[1]);
    } else {
      // Post-position patterns: "1 lakh budget", "1 lakh ke andar", "1 lakh tak", "1 lakh olage", "1 lakh kulla"
      const postUnderRegex = new RegExp(
        `(${PRICE_TOKEN_REGEX})\\s*(?:₹|rs\\.?|inr)?\\s*(?:budget|ke andar|tak|olage|varage|kulla|lopala|me|mein)\\b`,
        'i'
      );
      const postMatch = text.match(postUnderRegex);
      if (postMatch && postMatch[1]) {
        requirements.maxPrice = this.parsePriceValue(postMatch[1]);
      } else {
        const directUnder = text.match(new RegExp(`under\\s+(${PRICE_TOKEN_REGEX})`, 'i'));
        if (directUnder && directUnder[1]) {
          requirements.maxPrice = this.parsePriceValue(directUnder[1]);
        }
      }
    }

    // Min price extraction: "above 2000", "min 1000", "above 50k", "> 500", "starting from 1 lakh"
    const minRegex = new RegExp(
      `(?:above|more than|min|at least|>=?|>|starting from|starts at)\\s*(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})`,
      'i'
    );
    const minMatch = text.match(minRegex);
    if (minMatch && minMatch[1]) {
      requirements.minPrice = this.parsePriceValue(minMatch[1]);
    } else {
      const postMinRegex = new RegExp(
        `(${PRICE_TOKEN_REGEX})\\s*(?:₹|rs\\.?|inr)?\\s*(?:se upar|se jyada|se adhik|mele|hecchu|mela|adhigam|ekkuva|paina)\\b`,
        'i'
      );
      const postMinMatch = text.match(postMinRegex);
      if (postMinMatch && postMinMatch[1]) {
        requirements.minPrice = this.parsePriceValue(postMinMatch[1]);
      }
    }

    // Range: "between 50k and 1 lakh", "between 2000 and 5000", "40000 to 100000"
    const rangeRegex = new RegExp(
      `between\\s*(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})\\s*(?:and|to|-)\\s*(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})`,
      'i'
    );
    const rangeMatch = text.match(rangeRegex);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      requirements.minPrice = this.parsePriceValue(rangeMatch[1]);
      requirements.maxPrice = this.parsePriceValue(rangeMatch[2]);
    } else {
      const directRange = text.match(
        new RegExp(
          `(?:from\\s*)?(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})\\s*(?:to|-)\\s*(?:₹|rs\\.?|inr)?\\s*(${PRICE_TOKEN_REGEX})\\s*(?:budget|range)?`,
          'i'
        )
      );
      if (directRange && directRange[1] && directRange[2]) {
        const p1 = this.parsePriceValue(directRange[1]);
        const p2 = this.parsePriceValue(directRange[2]);
        if (p1 > 0 && p2 > 0) {
          requirements.minPrice = Math.min(p1, p2);
          requirements.maxPrice = Math.max(p1, p2);
        }
      }
    }

    if (requirements.minPrice !== undefined && requirements.maxPrice !== undefined && requirements.minPrice > requirements.maxPrice) {
      const temp = requirements.minPrice;
      requirements.minPrice = requirements.maxPrice;
      requirements.maxPrice = temp;
    }

    // Category extraction
    const categoriesMap: Record<string, string[]> = {
      'Shoes': ['shoe', 'shoes', 'running shoes', 'sneakers', 'boots', 'footwear', 'pro shoes'],
      'Laptops': ['laptop', 'laptops', 'notebook', 'macbook', 'pc', 'pro laptop', 'gaming laptop'],
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

    // Discount percentage extraction (e.g. "20%", "80% discount", "what about 15%?")
    const discountMatch = text.match(/(\d{1,3})%\s*(?:discount|off)?/i) || text.match(/(?:discount|off)\s*(?:of)?\s*(\d{1,3})%/i);
    if (discountMatch && discountMatch[1]) {
      const parsedPct = parseInt(discountMatch[1], 10);
      if (parsedPct >= 0 && parsedPct <= 100) {
        requirements.discountPercentage = parsedPct;
      }
    }

    // Follow-up detection (e.g. "what about 15%?", "why this product?", "why?", "can I do that?")
    if (/\b(what about|how about|why|why this|why that|can i do that|what about the other|and for)\b/i.test(text)) {
      requirements.isFollowUp = true;
    }

    // Referential alternative extraction (e.g. "the other shoe", "the other product", "the second one", "the alternative", "another product")
    if (
      /\b(?:the\s+)?(?:other|another|second|alternative|different)\s+(?:one|shoe|shoes|product|item|option)?\b/i.test(text) ||
      /\bwhat about (?:the\s+)?(?:other|second|alternative)\b/i.test(text)
    ) {
      requirements.isAlternativeReferenced = true;
      requirements.isFollowUp = true;
    }

    return requirements;
  }

  public static detectBuyerIntent(message: string): BuyerIntent {
    const text = message.toLowerCase().trim();

    if (!text) {
      return 'UNKNOWN';
    }

    // Add to Cart
    if (
      /\b(add\b.*(?:cart|bag)|put\b.*(?:cart|bag)|add the second one|add the first one|add second|add first|add to cart|add to my cart)\b/i.test(text)
    ) {
      return 'ADD_TO_CART';
    }

    // View Cart
    if (
      /\b(view cart|show cart|what is in my cart|whats in my cart|check cart|cart items|cart total|open cart|see my cart)\b/i.test(text)
    ) {
      return 'VIEW_CART';
    }

    // Remove from Cart
    if (
      /\b(remove from cart|delete from cart|take out of cart|remove item)\b/i.test(text)
    ) {
      return 'REMOVE_FROM_CART';
    }

    // Payment / Order Status
    if (/\b(payment status|status of payment|transaction status|did my payment go through)\b/i.test(text)) {
      return 'PAYMENT_STATUS';
    }
    if (/\b(order status|where is my order|track order|my orders)\b/i.test(text)) {
      return 'ORDER_STATUS';
    }

    // Checkout / Purchase Request
    if (/\b(buy it|buy this|checkout|order now|proceed to payment|purchase|place order|pay now|yes buy|ready to buy|proceed to verified checkout)\b/i.test(text)) {
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
    if (/\b(is this available|in stock|out of stock|available|do you have stock|how many in stock)\b/i.test(text)) {
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

    // Cross sell inquiry / "What else should I buy with it?"
    if (/\b(what else should i buy|what else should i get|accessory|accessories|related item|goes with|complementary|matching|bundle with)\b/i.test(text)) {
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

    // General greetings / assistance / currency meaning
    if (
      /\b(hello|hi|hey|help|assist|namaste|vanakkam|namaskara)\b/i.test(text) ||
      /\b(?:1\s*lakh|one\s*lakh|lakh|crore)\s*(?:means|equals|meaning|matlab|kya hai)\b/i.test(text) ||
      /\b(?:what is|how much is|what does)\s*(?:1\s*lakh|one\s*lakh|a lakh|lakh|a crore)\b/i.test(text)
    ) {
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

    // Discount Recommendation / Evaluation
    if (
      /(\d+)%/i.test(text) ||
      /\b(discount|give discount|offer discount|how much discount|recommend discount|cut price)\b/i.test(text)
    ) {
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

    if (mode === 'merchant') {
      const text = message.toLowerCase().trim();
      if (/\b(best opportunity|strongest opportunity|top opportunity|highest opportunity)\b/i.test(text)) {
        requirements.subIntent = 'BEST_OPPORTUNITY';
      } else if (requirements.discountPercentage !== undefined) {
        requirements.subIntent = 'DISCOUNT_EVALUATION';
      } else if (requirements.isAlternativeReferenced) {
        requirements.subIntent = 'ALTERNATIVE_PRODUCT_QUERY';
      } else if (requirements.category && /\b(promote|promotion|what to sell|what should i promote|which .* should i promote)\b/i.test(text)) {
        requirements.subIntent = 'CATEGORY_PROMOTION';
      } else if (/\b(why|why this|why that|explain why)\b/i.test(text)) {
        requirements.subIntent = 'FOLLOW_UP_REASON';
      } else if (intent === 'PRODUCT_PROMOTION') {
        requirements.subIntent = 'GENERAL_PROMOTION';
      }
    }

    return {
      intent,
      subIntent: requirements.subIntent,
      mode,
      confidence: intent !== 'UNKNOWN' ? 0.95 : 0.2,
      requirements,
      rawMessage: message,
    };
  }
}
