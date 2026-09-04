import mongoose from 'mongoose';
import crypto from 'crypto';
import { IntentService, IntentResult, ExtractedRequirements } from './intentService';
import { ToolRegistry, AgentToolContext } from './toolRegistry';
import { ToolExecutionService, ToolExecutionResponse } from './toolExecutionService';
import { ConversationService } from './conversationService';
import { ConversationCartService } from './conversationCartService';
import { AuditService } from './auditService';
import { MerchantService } from './merchantService';
import { callNvidiaChatCompletion, resolveAiProvider } from './agentRevenueRecommendationService';
import { CustomError } from '../middleware/errorHandler';

export interface ChatRequestParams {
  message: string;
  mode?: 'buyer' | 'merchant';
  language?: string;
  conversationId?: string;
  userId?: string;
  merchantId?: string;
  userRole?: string;
  correlationId?: string;
}

export interface ToolExecutionSummary {
  tool: string;
  arguments: Record<string, unknown>;
  success: boolean;
  resultSummary: string;
  executionTimeMs?: number;
}

export interface ChatResponseResult {
  success: boolean;
  intent: string;
  message: string;
  language: string;
  mode: 'buyer' | 'merchant';
  products?: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    stock: number;
    category: string;
    available: boolean;
    reason?: string;
  }>;
  upsell?: {
    productId: string;
    name: string;
    price: number;
    priceDiff: number;
    reason: string;
  } | null;
  crossSells?: Array<{
    productId: string;
    name: string;
    price: number;
    reason: string;
  }>;
  cart?: {
    items: any[];
    totalItems: number;
    subtotal: number;
    currency: string;
  };
  toolsExecuted?: ToolExecutionSummary[];
  merchantInsights?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  conversationId?: string;
  correlationId?: string;
}

/**
 * In-memory cache of recent product search results per conversation / user session
 * to allow referential actions like "add the second one to my cart".
 */
const sessionRecentProducts: Map<string, Array<{ id: string; name: string; price: number; stock: number }>> = new Map();

const cacheRecentProducts = (
  sessionKey: string,
  context: AgentToolContext,
  products: Array<{ id: string; name: string; price: number; stock: number }>
) => {
  sessionRecentProducts.set(sessionKey, products);
  if (context.conversationId) {
    sessionRecentProducts.set(context.conversationId, products);
  }
  if (context.userId) {
    sessionRecentProducts.set(context.userId, products);
  }
};

const getRecentProducts = (
  sessionKey: string,
  context: AgentToolContext
): Array<{ id: string; name: string; price: number; stock: number }> => {
  if (context.conversationId && sessionRecentProducts.has(context.conversationId)) {
    return sessionRecentProducts.get(context.conversationId)!;
  }
  if (sessionRecentProducts.has(sessionKey)) {
    return sessionRecentProducts.get(sessionKey)!;
  }
  if (context.userId && sessionRecentProducts.has(context.userId)) {
    return sessionRecentProducts.get(context.userId)!;
  }
  return [];
};

/**
 * In-memory conversation state for merchant mode to enable multi-turn continuity
 * and follow-up reasoning (e.g. "What about 15%?", "Why this product?").
 */
export interface MerchantConversationState {
  lastProduct?: {
    id?: string;
    name: string;
    category?: string;
    price?: number;
    stock?: number;
    reason?: string;
  };
  lastCategory?: string;
  lastDiscountPercentage?: number;
  lastIntent?: string;
  lastSubIntent?: string;
  lastAnswer?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const sessionMerchantMemory: Map<string, MerchantConversationState> = new Map();

const getMerchantMemory = (
  sessionKey: string,
  context: AgentToolContext
): MerchantConversationState => {
  if (context.conversationId) {
    if (sessionMerchantMemory.has(context.conversationId)) {
      return sessionMerchantMemory.get(context.conversationId)!;
    }
    return { history: [] };
  }
  if (sessionMerchantMemory.has(sessionKey)) {
    return sessionMerchantMemory.get(sessionKey)!;
  }
  if (context.merchantId && sessionMerchantMemory.has(context.merchantId)) {
    return sessionMerchantMemory.get(context.merchantId)!;
  }
  return { history: [] };
};

const saveMerchantMemory = (
  sessionKey: string,
  context: AgentToolContext,
  state: MerchantConversationState
) => {
  sessionMerchantMemory.set(sessionKey, state);
  if (context.conversationId) {
    sessionMerchantMemory.set(context.conversationId, state);
  } else if (context.merchantId) {
    sessionMerchantMemory.set(context.merchantId, state);
  }
};


export class AgentService {
  /**
   * Main Agent Reasoning and Tool Execution Gateway
   */
  public static async processChatMessage(params: ChatRequestParams): Promise<ChatResponseResult> {
    const rawMessage = (params.message || '').trim();
    if (!rawMessage) {
      throw new CustomError('Message is required', 400, 'INVALID_REQUEST');
    }

    const mode = params.mode || 'buyer';
    const reqLang = params.language || 'en';
    const correlationId = params.correlationId && /^spc_[a-f0-9-]{36}$/.test(params.correlationId)
      ? params.correlationId
      : `spc_${crypto.randomUUID()}`;

    // 1. Intent Detection & Requirement Extraction
    const intentResult = IntentService.processMessage(rawMessage, mode);
    const requirements = intentResult.requirements;
    const finalLanguage = reqLang !== 'en' ? reqLang : requirements.detectedLanguage || 'en';

    // 2. Conversation Context Resolution
    let conversation = null;
    let conversationWasCreated = false;

    if (mongoose.connection.readyState !== 0) {
      if (params.conversationId && mongoose.Types.ObjectId.isValid(params.conversationId)) {
        try {
          conversation = await ConversationService.getConversationById(
            params.conversationId,
            params.userId,
            params.merchantId
          );
        } catch {
          // Continue if conversation not found
        }
      }

      if (!conversation && params.userId) {
        try {
          conversation = await ConversationService.createConversation({
            userId: params.userId,
            merchantId: params.merchantId,
            mode,
            language: finalLanguage,
            initialMessage: { role: 'user', content: rawMessage },
          });
          conversationWasCreated = true;
        } catch {
          // Fallback gracefully
        }
      }
    }

    const resolvedConversationId = conversation?._id?.toString() || params.conversationId;
    const sessionKey = resolvedConversationId || params.userId || 'default_session';

    const context: AgentToolContext = {
      userId: params.userId,
      merchantId: params.merchantId || (mode === 'merchant' ? params.userId : undefined),
      userRole: params.userRole || (mode === 'merchant' ? 'merchant' : 'customer'),
      conversationId: resolvedConversationId,
      language: finalLanguage,
      correlationId,
    };

    await AuditService.log({
      userId: params.userId,
      merchantId: context.merchantId,
      action: 'agent_intent_detected',
      eventType: 'intent_detected',
      actorType: mode === 'merchant' ? 'merchant_agent' : 'buyer_agent',
      actorId: params.userId,
      correlationId,
      status: 'success',
      metadata: { intent: intentResult.intent, mode },
    });

    if (conversation && params.userId && !conversationWasCreated) {
      await ConversationService.addMessage(
        conversation._id.toString(),
        'user',
        rawMessage,
        params.userId,
        params.merchantId
      );
    }

    // 3. Dispatch to Agent Reasoning Layer
    const response = mode === 'merchant'
      ? await this.executeMerchantAgentFlow(params, intentResult, finalLanguage, context, sessionKey)
      : await this.executeBuyerAgentFlow(params, intentResult, finalLanguage, context, sessionKey);

    if (conversation && params.userId) {
      await ConversationService.addMessage(
        conversation._id.toString(),
        'assistant',
        response.message,
        params.userId,
        params.merchantId
      );
    }

    response.correlationId = correlationId;
    return response;
  }

  /**
   * Buyer Agent Tool Orchestration Flow
   */
  private static async executeBuyerAgentFlow(
    params: ChatRequestParams,
    intentResult: IntentResult,
    language: string,
    context: AgentToolContext,
    sessionKey: string
  ): Promise<ChatResponseResult> {
    const { intent, requirements, rawMessage } = intentResult;
    const toolsExecuted: ToolExecutionSummary[] = [];

    // CASE 1: Checkout / Payment Request
    if (intent === 'PURCHASE_REQUEST' || intent === 'PAYMENT_REQUEST') {
      // Execute calculateCart tool to verify final amounts
      const calcResult = await ToolExecutionService.executeTool({
        toolName: 'calculateCart',
        arguments: { conversationId: context.conversationId, userId: context.userId },
        context,
      });

      if (calcResult.success && calcResult.data) {
        toolsExecuted.push({
          tool: 'calculateCart',
          arguments: calcResult.arguments,
          success: true,
          resultSummary: `Calculated verified subtotal: ₹${calcResult.data.subtotal}, total: ₹${calcResult.data.total}`,
          executionTimeMs: calcResult.executionTimeMs,
        });
      }

      return {
        success: true,
        intent: 'PURCHASE_REQUEST',
        message: 'Your total is ready. Ready to continue to secure Razorpay Test Mode checkout?',
        language,
        mode: 'buyer',
        toolsExecuted,
        requiresConfirmation: true,
        conversationId: context.conversationId,
      };
    }

    // CASE 2: Add to Cart (Direct or Referential e.g., "Add the second one to my cart")
    if (intent === 'ADD_TO_CART') {
      let targetIdentifier: string | undefined = requirements.targetProductName;
      let targetProductFromContext: { id: string; name: string } | undefined;
      const recentList = getRecentProducts(sessionKey, context);

      // Handle ordinal references (e.g. "add the second one")
      if (requirements.targetOrdinal) {
        const index = requirements.targetOrdinal - 1;
        if (recentList[index]) {
          targetProductFromContext = recentList[index];
          targetIdentifier = targetProductFromContext.id;
        }
      } else if (requirements.isCheapestRequested) {
        // Handle cheapest selection (e.g. "add the cheapest one to my cart")
        if (recentList.length > 0) {
          const sorted = [...recentList].sort((a, b) => a.price - b.price);
          targetProductFromContext = sorted[0];
          targetIdentifier = targetProductFromContext.id;
        }
      }

      // If no ordinal or cheapest matched, check if keywords or category identify a single item or recent item
      if (!targetIdentifier) {
        if (recentList.length > 0) {
          targetProductFromContext = recentList[0];
          targetIdentifier = targetProductFromContext.id;
        } else {
          targetIdentifier = requirements.category || 'Pro Running Shoes';
        }
      }

      const isId = !!targetIdentifier && (mongoose.Types.ObjectId.isValid(targetIdentifier) || targetIdentifier.startsWith('mock_'));

      // Step A: Check inventory tool
      const invResult = await ToolExecutionService.executeTool({
        toolName: 'checkInventory',
        arguments: {
          productId: isId ? targetIdentifier : undefined,
          name: !isId ? targetIdentifier : targetProductFromContext?.name,
          requestedQuantity: requirements.quantity || 1,
        },
        context,
      });

      if (invResult.success && invResult.data) {
        toolsExecuted.push({
          tool: 'checkInventory',
          arguments: invResult.arguments,
          success: true,
          resultSummary: `Verified ${invResult.data.productName} stock: ${invResult.data.stock} available.`,
          executionTimeMs: invResult.executionTimeMs,
        });
      }

      // Step B: Add to cart tool
      const addResult = await ToolExecutionService.executeTool({
        toolName: 'addToCart',
        arguments: {
          productId: isId ? targetIdentifier : undefined,
          name: !isId ? targetIdentifier : targetProductFromContext?.name,
          quantity: requirements.quantity || 1,
          conversationId: context.conversationId,
          userId: context.userId,
        },
        context,
      });

      if (addResult.success && addResult.data) {
        toolsExecuted.push({
          tool: 'addToCart',
          arguments: addResult.arguments,
          success: true,
          resultSummary: `Added ${addResult.data.addedItem.name} (Qty: ${addResult.data.addedItem.quantity}) to cart. Total items: ${addResult.data.totalItems}.`,
          executionTimeMs: addResult.executionTimeMs,
        });

        // Step C: Suggest cross-sell complementary item
        const crossResult = await ToolExecutionService.executeTool({
          toolName: 'getCrossSells',
          arguments: {
            productId: addResult.data.addedItem.productId,
            name: addResult.data.addedItem.name,
          },
          context,
        });

        let crossSells: any[] = [];
        if (crossResult.success && crossResult.data?.crossSells) {
          crossSells = crossResult.data.crossSells;
          toolsExecuted.push({
            tool: 'getCrossSells',
            arguments: crossResult.arguments,
            success: true,
            resultSummary: `Found ${crossSells.length} complementary cross-sell item(s).`,
            executionTimeMs: crossResult.executionTimeMs,
          });
        }

        const itemName = addResult.data.addedItem.name;
        return {
          success: true,
          intent: 'ADD_TO_CART',
          message: `I've added ${itemName} (₹${addResult.data.addedItem.price}) to your cart. Your cart now has ${addResult.data.totalItems} item${addResult.data.totalItems > 1 ? 's' : ''} totaling ₹${addResult.data.subtotal.toLocaleString('en-IN')}.`,
          language,
          mode: 'buyer',
          cart: {
            items: addResult.data.items || [addResult.data.addedItem],
            totalItems: addResult.data.totalItems,
            subtotal: addResult.data.subtotal,
            currency: addResult.data.addedItem.currency,
          },
          crossSells,
          toolsExecuted,
          conversationId: context.conversationId,
        };
      } else {
        return {
          success: false,
          intent: 'ADD_TO_CART',
          message: addResult.error || 'Could not add the item to your cart due to inventory constraints.',
          language,
          mode: 'buyer',
          toolsExecuted,
          conversationId: context.conversationId,
        };
      }
    }

    // CASE 3: View Cart
    if (intent === 'VIEW_CART') {
      const cartResult = await ToolExecutionService.executeTool({
        toolName: 'getCart',
        arguments: { conversationId: context.conversationId, userId: context.userId },
        context,
      });

      if (cartResult.success && cartResult.data) {
        toolsExecuted.push({
          tool: 'getCart',
          arguments: cartResult.arguments,
          success: true,
          resultSummary: `Retrieved ${cartResult.data.totalItems} item(s) from cart with subtotal ₹${cartResult.data.subtotal}.`,
          executionTimeMs: cartResult.executionTimeMs,
        });

        const items = cartResult.data.items;
        let responseMsg = '';
        if (items.length === 0) {
          responseMsg = 'Your cart is currently empty. Tell me what products you are looking for!';
        } else {
          const itemSummary = items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ');
          responseMsg = `Your cart contains: ${itemSummary}. Total amount: ₹${cartResult.data.subtotal.toLocaleString('en-IN')}.`;
        }

        return {
          success: true,
          intent: 'VIEW_CART',
          message: responseMsg,
          language,
          mode: 'buyer',
          cart: cartResult.data,
          toolsExecuted,
          conversationId: context.conversationId,
        };
      }
    }

    // CASE 4: Remove from Cart
    if (intent === 'REMOVE_FROM_CART') {
      const targetIdentifier = requirements.targetProductName || requirements.category || 'Shoes';
      const removeResult = await ToolExecutionService.executeTool({
        toolName: 'removeFromCart',
        arguments: {
          name: targetIdentifier,
          conversationId: context.conversationId,
          userId: context.userId,
        },
        context,
      });

      if (removeResult.success && removeResult.data) {
        toolsExecuted.push({
          tool: 'removeFromCart',
          arguments: removeResult.arguments,
          success: true,
          resultSummary: `Removed item from cart. Remaining items: ${removeResult.data.remainingItems}.`,
          executionTimeMs: removeResult.executionTimeMs,
        });

        return {
          success: true,
          intent: 'REMOVE_FROM_CART',
          message: `Removed ${removeResult.data.removedName || targetIdentifier} from your cart. Remaining total: ₹${removeResult.data.subtotal.toLocaleString('en-IN')}.`,
          language,
          mode: 'buyer',
          toolsExecuted,
          conversationId: context.conversationId,
        };
      }
    }

    // CASE 5: Product Comparison / "Which is cheapest?"
    if (intent === 'PRODUCT_COMPARISON' || requirements.comparisonRequested || requirements.isCheapestRequested) {
      const compareResult = await ToolExecutionService.executeTool({
        toolName: 'compareProducts',
        arguments: {
          category: requirements.category,
        },
        context,
      });

      if (compareResult.success && compareResult.data?.comparison?.length > 0) {
        toolsExecuted.push({
          tool: 'compareProducts',
          arguments: compareResult.arguments,
          success: true,
          resultSummary: `Compared ${compareResult.data.comparison.length} products in ${requirements.category || 'catalog'}.`,
          executionTimeMs: compareResult.executionTimeMs,
        });

        const items = compareResult.data.comparison;
        const cheapest = items[0];
        const msg = requirements.isCheapestRequested
          ? `The cheapest available option is ${cheapest.name} at ₹${cheapest.price.toLocaleString('en-IN')}.`
          : `Comparing ${items.length} options: ${items.map((it: any) => `${it.name} (₹${it.price})`).join(' vs ')}.`;

        cacheRecentProducts(
          sessionKey,
          context,
          items.map((p: any) => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }))
        );

        return {
          success: true,
          intent: 'PRODUCT_COMPARISON',
          message: msg,
          language,
          mode: 'buyer',
          products: items.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency || 'INR',
            stock: p.stock,
            category: p.category,
            available: p.stock > 0,
            reason: p.id === cheapest.id ? 'Lowest price matching your query.' : 'Verified comparison candidate.',
          })),
          toolsExecuted,
          conversationId: context.conversationId,
        };
      }
    }

    // CASE 6: Cross-sell / "What else should I buy with it?"
    if (intent === 'CROSS_SELL') {
      const recentList = getRecentProducts(sessionKey, context);
      const primaryProduct = recentList[0];

      const crossResult = await ToolExecutionService.executeTool({
        toolName: 'getCrossSells',
        arguments: {
          productId: primaryProduct?.id,
          name: primaryProduct?.name || requirements.category || 'Running Shoes',
        },
        context,
      });

      let crossSells: any[] = [];
      if (crossResult.success && crossResult.data?.crossSells) {
        crossSells = crossResult.data.crossSells;
        toolsExecuted.push({
          tool: 'getCrossSells',
          arguments: crossResult.arguments,
          success: true,
          resultSummary: `Retrieved ${crossSells.length} complementary cross-sell recommendations.`,
          executionTimeMs: crossResult.executionTimeMs,
        });
      }

      const topCross = crossSells[0];
      const message = topCross
        ? `We recommend pairing with ${topCross.name} (₹${topCross.price}). ${topCross.reason}`
        : 'Based on our catalog, moisture-wicking sports socks or protective carrying cases pair well with this item.';

      return {
        success: true,
        intent: 'CROSS_SELL',
        message,
        language,
        mode: 'buyer',
        crossSells,
        toolsExecuted,
        conversationId: context.conversationId,
      };
    }

    // CASE 7: Upsell Request
    if (intent === 'UPSELL') {
      const recentList = getRecentProducts(sessionKey, context);
      const primaryProduct = recentList[0];

      const upsellResult = await ToolExecutionService.executeTool({
        toolName: 'getUpsell',
        arguments: {
          productId: primaryProduct?.id,
          name: primaryProduct?.name || requirements.category || 'Shoes',
        },
        context,
      });

      let upsellData = null;
      if (upsellResult.success && upsellResult.data?.upsell) {
        upsellData = upsellResult.data.upsell;
        toolsExecuted.push({
          tool: 'getUpsell',
          arguments: upsellResult.arguments,
          success: true,
          resultSummary: `Found premium upsell option: ${upsellData.name} (+₹${upsellData.priceDiff}).`,
          executionTimeMs: upsellResult.executionTimeMs,
        });
      }

      const message = upsellData
        ? `Consider the ${upsellData.name} for ₹${upsellData.priceDiff} more. ${upsellData.reason}`
        : 'You are currently viewing the top configuration in this tier.';

      return {
        success: true,
        intent: 'UPSELL',
        message,
        language,
        mode: 'buyer',
        upsell: upsellData,
        toolsExecuted,
        conversationId: context.conversationId,
      };
    }

    // CASE 8: Product Search & Recommendation (Default Discovery Tool Flow)
    const searchResult = await ToolExecutionService.executeTool({
      toolName: 'searchProducts',
      arguments: {
        category: requirements.category,
        query: requirements.keywords.join(' ') || rawMessage,
        keywords: requirements.keywords,
        minPrice: requirements.minPrice,
        maxPrice: requirements.maxPrice,
        features: requirements.features,
        inStockOnly: true,
      },
      context,
    });

    let foundProducts: any[] = [];
    if (searchResult.success && searchResult.data) {
      foundProducts = searchResult.data.products;
      toolsExecuted.push({
        tool: 'searchProducts',
        arguments: searchResult.arguments,
        success: true,
        resultSummary: `Found ${foundProducts.length} verified product(s) in catalog.`,
        executionTimeMs: searchResult.executionTimeMs,
      });

      // Cache recent search products for referential queries like "add the second one"
      cacheRecentProducts(
        sessionKey,
        context,
        foundProducts.map((p) => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }))
      );
    }

    if (foundProducts.length === 0) {
      return {
        success: true,
        intent: intent || 'PRODUCT_SEARCH',
        message: "I couldn't find products matching your criteria in the catalog. Please try a different price or category.",
        language,
        mode: 'buyer',
        products: [],
        toolsExecuted,
        conversationId: context.conversationId,
      };
    }

    // Execute upsell and cross-sell tools for primary product
    const primary = foundProducts[0];
    let upsellPayload = null;
    let crossSellsPayload: any[] = [];

    if (primary) {
      const [upsellRes, crossRes] = await Promise.all([
        ToolExecutionService.executeTool({
          toolName: 'getUpsell',
          arguments: { productId: primary.id, name: primary.name },
          context,
        }),
        ToolExecutionService.executeTool({
          toolName: 'getCrossSells',
          arguments: { productId: primary.id, name: primary.name },
          context,
        }),
      ]);

      if (upsellRes.success && upsellRes.data?.upsell) {
        upsellPayload = upsellRes.data.upsell;
        toolsExecuted.push({
          tool: 'getUpsell',
          arguments: upsellRes.arguments,
          success: true,
          resultSummary: `Found upsell: ${upsellPayload.name}`,
          executionTimeMs: upsellRes.executionTimeMs,
        });
      }

      if (crossRes.success && crossRes.data?.crossSells) {
        crossSellsPayload = crossRes.data.crossSells;
        toolsExecuted.push({
          tool: 'getCrossSells',
          arguments: crossRes.arguments,
          success: true,
          resultSummary: `Found ${crossSellsPayload.length} cross-sell accessory item(s)`,
          executionTimeMs: crossRes.executionTimeMs,
        });
      }
    }

    let responseText = `I found ${foundProducts.length} matching product${foundProducts.length > 1 ? 's' : ''}`;
    if (requirements.maxPrice) {
      responseText += ` under ₹${requirements.maxPrice.toLocaleString('en-IN')}`;
    }
    responseText += `. The ${primary.name} at ₹${primary.price.toLocaleString('en-IN')} is a great choice with strong availability.`;

    if (upsellPayload) {
      responseText += ` We also offer ${upsellPayload.name} for ₹${upsellPayload.priceDiff} more.`;
    }

    return {
      success: true,
      intent: intent || 'PRODUCT_SEARCH',
      message: responseText,
      language,
      mode: 'buyer',
      products: foundProducts,
      upsell: upsellPayload,
      crossSells: crossSellsPayload.slice(0, 2),
      toolsExecuted,
      conversationId: context.conversationId,
    };
  }

  private static resolveAlternativeProduct(
    state: MerchantConversationState,
    requirements: ExtractedRequirements,
    insights: any
  ): any | null {
    const targetCategory = (requirements.category || state.lastCategory || state.lastProduct?.category || '').toLowerCase();
    const currentProductName = (state.lastProduct?.name || '').toLowerCase();

    const candidates: any[] = [];
    const addCandidate = (item: any) => {
      if (item && item.name && !candidates.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
        candidates.push(item);
      }
    };

    (insights.topProducts || []).forEach(addCandidate);
    (insights.promotionOpportunities || []).forEach(addCandidate);
    (insights.bestOpportunities || []).forEach(addCandidate);
    (insights.upsellOpportunities || []).forEach((u: any) => {
      if (u.name) {
        addCandidate({
          name: u.name,
          price: u.price !== undefined ? u.price : 2499,
          category: u.category || 'Shoes',
          stock: u.stock !== undefined ? u.stock : 5,
          id: u.productId,
        });
      }
      if (u.premiumName) {
        addCandidate({
          name: u.premiumName,
          price: u.premiumPrice !== undefined ? u.premiumPrice : 2999,
          category: u.category || 'Shoes',
          stock: u.stock !== undefined ? u.stock : 15,
          id: u.premiumProductId,
        });
      }
    });

    // Filter candidates distinct from currently discussed product
    const distinctCandidates = candidates.filter((c) => {
      const nameLower = c.name.toLowerCase();
      const isCurrent = currentProductName && (nameLower.includes(currentProductName) || currentProductName.includes(nameLower));
      if (isCurrent) return false;
      if (targetCategory) {
        const cat = (c.category || '').toLowerCase();
        return cat.includes(targetCategory) || targetCategory.includes(cat);
      }
      return true;
    });

    if (distinctCandidates.length > 0) {
      return distinctCandidates[0];
    }

    // Fallback to any distinct candidate in catalog
    const anyDistinct = candidates.filter((c) => {
      const nameLower = c.name.toLowerCase();
      return !currentProductName || (!nameLower.includes(currentProductName) && !currentProductName.includes(nameLower));
    });

    return anyDistinct.length > 0 ? anyDistinct[0] : null;
  }

  private static findUpsellRelationship(
    prodA: any,
    prodB: any,
    insights: any
  ): { diff: number; base: string; premium: string } | null {
    if (!prodA || !prodB) return null;
    const nameA = (prodA.name || '').toLowerCase();
    const nameB = (prodB.name || '').toLowerCase();

    for (const u of insights.upsellOpportunities || []) {
      const uName = (u.name || '').toLowerCase();
      const uPrem = (u.premiumName || '').toLowerCase();
      if ((uName.includes(nameA) || nameA.includes(uName)) && (uPrem.includes(nameB) || nameB.includes(uPrem))) {
        return { diff: u.priceDiff || 500, base: u.name, premium: u.premiumName };
      }
      if ((uName.includes(nameB) || nameB.includes(uName)) && (uPrem.includes(nameA) || nameA.includes(uPrem))) {
        return { diff: u.priceDiff || 500, base: u.name, premium: u.premiumName };
      }
    }

    if (prodA.price && prodB.price && Math.abs(prodA.price - prodB.price) > 0) {
      const base = prodA.price < prodB.price ? prodA.name : prodB.name;
      const premium = prodA.price < prodB.price ? prodB.name : prodA.name;
      return { diff: Math.abs(prodA.price - prodB.price), base, premium };
    }

    return null;
  }

  /**
   * Merchant Agent Tool Orchestration Flow
   */
  private static async executeMerchantAgentFlow(
    params: ChatRequestParams,
    intentResult: IntentResult,
    language: string,
    context: AgentToolContext,
    sessionKey: string
  ): Promise<ChatResponseResult> {
    const { intent, subIntent, rawMessage, requirements } = intentResult;
    const toolsExecuted: ToolExecutionSummary[] = [];
    const state = getMerchantMemory(sessionKey, context);

    // 1. Guardrail for missing context on ambiguous referential queries (e.g. "What about the other product?")
    if (requirements.isAlternativeReferenced && !state.lastProduct && !state.lastCategory && !requirements.category) {
      const clarificationMsg = 'Which product or category are you referring to? Please specify so I can retrieve the accurate catalog details.';
      state.history.push({ role: 'user', content: rawMessage });
      state.history.push({ role: 'assistant', content: clarificationMsg });
      if (state.history.length > 8) state.history = state.history.slice(-8);
      saveMerchantMemory(sessionKey, context, state);

      return {
        success: true,
        intent: intent || 'PRODUCT_PROMOTION',
        message: clarificationMsg,
        language,
        mode: 'merchant',
        toolsExecuted,
        conversationId: context.conversationId,
      };
    }

    // Extract requested discount if present in query or extracted requirements
    let requestedPct = requirements.discountPercentage;
    if (requestedPct === undefined) {
      const discountMatch = rawMessage.match(/(\d+)%\s*(?:discount|off)?/i);
      if (discountMatch) {
        requestedPct = parseInt(discountMatch[1], 10);
      }
    }

    // Resolve category or product context for follow-ups (e.g., "What about 15%?")
    const activeCategory = requirements.category || (requirements.isFollowUp ? state.lastCategory : undefined);

    // Guardrail Check Tool: validateDiscount
    if (requestedPct !== undefined) {
      const discountValidationRes = await ToolExecutionService.executeTool({
        toolName: 'validateDiscount',
        arguments: { discountPercentage: requestedPct, merchantId: context.merchantId },
        context,
      });

      if (discountValidationRes.success && discountValidationRes.data) {
        const maxAllowed = discountValidationRes.data.maxAllowed || 25;
        toolsExecuted.push({
          tool: 'validateDiscount',
          arguments: discountValidationRes.arguments,
          success: true,
          resultSummary: `Validated ${requestedPct}% discount. Allowed: ${discountValidationRes.data.valid} (Max: ${maxAllowed}%).`,
          executionTimeMs: discountValidationRes.executionTimeMs,
        });

        if (!discountValidationRes.data.valid) {
          const rejectMsg = `I cannot recommend an ${requestedPct}% discount because it exceeds your configured limit of ${maxAllowed}%. Safe limit is up to ${maxAllowed}%.`;
          state.lastDiscountPercentage = requestedPct;
          state.history.push({ role: 'user', content: rawMessage });
          state.history.push({ role: 'assistant', content: rejectMsg });
          if (state.history.length > 8) state.history = state.history.slice(-8);
          saveMerchantMemory(sessionKey, context, state);

          return {
            success: false,
            intent: 'DISCOUNT_RECOMMENDATION',
            message: rejectMsg,
            language,
            mode: 'merchant',
            toolsExecuted,
            conversationId: context.conversationId,
          };
        }
      }
    }

    // Tool: getMerchantInsights
    const insightsResult = await ToolExecutionService.executeTool({
      toolName: 'getMerchantInsights',
      arguments: { merchantId: context.merchantId },
      context,
    });

    if (!insightsResult.success) {
      throw new CustomError(
        insightsResult.error || 'Merchant authorization required for merchant mode',
        403,
        'FORBIDDEN'
      );
    }

    toolsExecuted.push({
      tool: 'getMerchantInsights',
      arguments: insightsResult.arguments,
      success: true,
      resultSummary: 'Retrieved real-time promotion opportunities, top performers, and cross-sell metrics.',
      executionTimeMs: insightsResult.executionTimeMs,
    });

    const insights = insightsResult.data.insights;
    const topOpportunity = insights.promotionOpportunities?.[0];
    const bestOpportunity = insights.bestOpportunities?.[0] || topOpportunity;
    const topCrossSell = insights.crossSellOpportunities?.[0];
    const topUpsell = insights.upsellOpportunities?.[0];
    const topProduct = insights.topProducts?.[0];

    // Filter by active category if specified
    const categoryOpportunity = activeCategory
      ? (insights.promotionOpportunities?.find((p: any) => p.category?.toLowerCase().includes(activeCategory.toLowerCase())) ||
         insights.bestOpportunities?.find((p: any) => p.category?.toLowerCase().includes(activeCategory.toLowerCase())))
      : null;

    // Resolve alternative product if referenced (e.g. "the other shoe", "the other product", "the second one")
    let resolvedAlternative: any = null;
    let upsellRelation: { diff: number; base: string; premium: string } | null = null;
    if (requirements.isAlternativeReferenced) {
      resolvedAlternative = this.resolveAlternativeProduct(state, requirements, insights);
      if (resolvedAlternative && state.lastProduct) {
        upsellRelation = this.findUpsellRelationship(resolvedAlternative, state.lastProduct, insights);
      }
    }

    // Featured product determination for context memory
    let featuredItem: any = null;
    if (resolvedAlternative) {
      featuredItem = resolvedAlternative;
    } else if (categoryOpportunity && subIntent === 'CATEGORY_PROMOTION') {
      featuredItem = categoryOpportunity;
    } else if (subIntent === 'BEST_OPPORTUNITY') {
      featuredItem = bestOpportunity;
    } else if (subIntent === 'FOLLOW_UP_REASON' && state.lastProduct) {
      featuredItem = state.lastProduct;
    } else if (intent === 'CROSS_SELL_OPPORTUNITY') {
      featuredItem = topCrossSell;
    } else if (intent === 'UPSELL_OPPORTUNITY') {
      featuredItem = topUpsell;
    } else if (intent === 'PRODUCT_PERFORMANCE') {
      featuredItem = topProduct;
    } else if (categoryOpportunity) {
      featuredItem = categoryOpportunity;
    } else {
      featuredItem = topOpportunity || bestOpportunity;
    }

    let responseText = '';

    // Attempt NVIDIA NIM dynamic response generation with grounded merchant store facts
    // In automated Jest test environments, avoid unmocked external HTTP calls that breach Jest's 5s timeout
    const isTestEnv = process.env.NODE_ENV === 'test' && !process.env.LIVE_AI_TEST;
    const provider = isTestEnv ? 'none' : resolveAiProvider();
    if (provider === 'nvidia' || provider === 'gemini') {
      try {
        const systemPrompt = `You are SellPilot AI's intelligent merchant revenue copilot.
You assist the store owner with pricing strategy, product promotions, cross-sells, upsells, and inventory optimization.
CRITICAL RULES:
1. Ground all answers ONLY in the provided merchant catalog facts, metrics, and policy rules.
2. NEVER invent products, prices, margins, or fictional discounts.
3. Maximum allowed promotion discount is 25%. Any higher discount must be rejected.
4. When the merchant asks about another product or alternative ("What about the other shoe?", "What about the second one?"), answer the contextual product comparison directly using its actual catalog details and relationship. Do NOT invent any discount percentage or promotion recommendation unless explicitly requested.
5. Answer the store owner's exact question directly, professionally, and concisely (1-3 sentences).
6. Explain the underlying business reason (inventory depth, margin, or revenue potential) when appropriate.
7. For follow-up questions, maintain context from previous turns.`;

        const factsPrompt = `Merchant Store Facts & Insights:
- Best Opportunity Product: ${bestOpportunity ? `${bestOpportunity.name} (${bestOpportunity.category}, ₹${bestOpportunity.price}, ${bestOpportunity.stock} in stock - ${bestOpportunity.reason || 'High upside'})` : 'None'}
- Top Promotion Candidate: ${topOpportunity ? `${topOpportunity.name} (${topOpportunity.category}, ₹${topOpportunity.price}, ${topOpportunity.stock} in stock - ${topOpportunity.reason})` : 'None'}
- Category Focus: ${categoryOpportunity ? `${categoryOpportunity.name} (${categoryOpportunity.category}, ₹${categoryOpportunity.price}, ${categoryOpportunity.stock} in stock)` : activeCategory || 'None'}
${resolvedAlternative ? `- Resolved Alternative Product: ${resolvedAlternative.name} (${resolvedAlternative.category}, ₹${resolvedAlternative.price}, ${resolvedAlternative.stock} in stock)` : ''}
${upsellRelation ? `- Upsell Relationship: ${upsellRelation.base} -> ${upsellRelation.premium} (+₹${upsellRelation.diff})` : ''}
- Cross-Sell Opportunity: ${topCrossSell ? `Pair ${topCrossSell.name} with ${topCrossSell.relatedName}` : 'None'}
- Upsell Opportunity: ${topUpsell ? `Upgrade ${topUpsell.name} to ${topUpsell.premiumName} (+₹${topUpsell.priceDiff})` : 'None'}
- Top Performing Product: ${topProduct ? `${topProduct.name} in ${topProduct.category} (₹${topProduct.price}, ${topProduct.stock} units)` : 'None'}
${requestedPct !== undefined ? `- Discount Request: ${requestedPct}% is VALID and within safe ceiling (max allowed 25%).` : ''}
${state.lastProduct ? `- Last Discussed Product: ${state.lastProduct.name} (${state.lastProduct.category}, ₹${state.lastProduct.price}, ${state.lastProduct.stock} in stock)` : ''}

Conversation History:
${state.history.slice(-4).map(h => `${h.role === 'user' ? 'Merchant' : 'SellPilot'}: ${h.content}`).join('\n')}

Current Merchant Query: "${rawMessage}"
Intent: ${intent}
Sub-Intent: ${subIntent || 'GENERAL'}`;

        const aiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: factsPrompt },
        ];

        const aiOutput = await callNvidiaChatCompletion(aiMessages, 250, 0.2);
        if (aiOutput && aiOutput.trim().length > 10) {
          responseText = aiOutput.trim();
        }
      } catch {
        // Fall back gracefully to authoritative dynamic generator
      }
    }

    // Contextual Dynamic Fallback if AI service is offline, slow, or fails
    if (!responseText) {
      if (requestedPct !== undefined) {
        const targetProduct = resolvedAlternative || categoryOpportunity || state.lastProduct || topOpportunity;
        const targetName = targetProduct?.name || 'this item';
        const targetPrice = targetProduct?.price;
        const priceDisplay = targetPrice ? ` (₹${targetPrice.toLocaleString('en-IN')})` : '';
        const discountedPrice = targetPrice ? ` (discounted to ₹${Math.round(targetPrice * (1 - requestedPct / 100)).toLocaleString('en-IN')})` : '';
        responseText = `A ${requestedPct}% discount on ${targetName}${priceDisplay} is safe and within your store's 25% margin ceiling${discountedPrice}. It will help stimulate checkout volume while preserving healthy profit margins.`;
      } else if (requirements.isAlternativeReferenced && resolvedAlternative) {
        const priceDisplay = resolvedAlternative.price !== undefined ? `₹${resolvedAlternative.price.toLocaleString('en-IN')}` : 'standard pricing';
        const stockDisplay = resolvedAlternative.stock !== undefined ? `${resolvedAlternative.stock} units in stock` : 'in stock';
        if (upsellRelation) {
          const categoryTerm = resolvedAlternative.category ? resolvedAlternative.category.toLowerCase().replace(/s$/, '') : 'product';
          responseText = `Your other ${categoryTerm} in the catalog is ${resolvedAlternative.name} (${priceDisplay}, ${stockDisplay}). It has an established upsell relationship to your ${state.lastProduct?.name || 'Pro Carbon Running Shoes'} (+₹${upsellRelation.diff}), offering customers a clear upgrade path.`;
        } else {
          responseText = `Your other product is ${resolvedAlternative.name} in ${resolvedAlternative.category || 'the catalog'} (${priceDisplay}, ${stockDisplay}). It serves as a viable alternative for customers browsing this line.`;
        }
      } else if (subIntent === 'BEST_OPPORTUNITY') {
        if (bestOpportunity) {
          const priceDisplay = bestOpportunity.price !== undefined ? `₹${bestOpportunity.price.toLocaleString('en-IN')}` : 'competitive pricing';
          const stockDisplay = bestOpportunity.stock !== undefined ? `${bestOpportunity.stock} in stock` : 'healthy inventory';
          responseText = `Your best opportunity right now is ${bestOpportunity.name} in ${bestOpportunity.category || 'your catalog'} (${priceDisplay}, ${stockDisplay}). ${bestOpportunity.reason || 'It combines strong inventory depth with healthy margins for maximum revenue velocity.'}`;
        } else {
          responseText = `Based on current catalog demand, your inventory is well-balanced across active categories.`;
        }
      } else if (subIntent === 'FOLLOW_UP_REASON') {
        const explained = state.lastProduct || topOpportunity;
        if (explained) {
          responseText = `${explained.name} is recommended because of its solid stock level (${explained.stock !== undefined ? `${explained.stock} units` : 'healthy volume'}) in ${explained.category || 'the catalog'} at ₹${explained.price?.toLocaleString('en-IN') || 'standard price'}, ensuring you can fulfill customer demand while maintaining sound profit margins.`;
        } else {
          responseText = `This recommendation is based on inventory depth, pricing tiers, and profit margins across your active store catalog.`;
        }
      } else if (subIntent === 'CATEGORY_PROMOTION' && categoryOpportunity) {
        responseText = `For your ${categoryOpportunity.category} collection, your ${categoryOpportunity.name} is the prime candidate for promotion (${categoryOpportunity.reason || 'High stock with healthy margin'}).`;
      } else if (intent === 'CROSS_SELL_OPPORTUNITY' || subIntent === 'CROSS_SELL') {
        if (topCrossSell) {
          responseText = `We recommend pairing ${topCrossSell.name} with ${topCrossSell.relatedName} as a complementary bundle.`;
        } else {
          responseText = `To enable cross-selling bundles, consider adding complementary accessories or related items to your catalog.`;
        }
      } else if (intent === 'UPSELL_OPPORTUNITY' || subIntent === 'UPSELL') {
        if (topUpsell) {
          responseText = `Consider offering ${topUpsell.premiumName} as a premium alternative when customers view ${topUpsell.name} (₹${topUpsell.priceDiff} difference).`;
        } else {
          responseText = `To maximize revenue through upselling, consider adding higher-tier premium options in your key categories.`;
        }
      } else if (intent === 'PRODUCT_PERFORMANCE') {
        if (topProduct) {
          responseText = `${topProduct.name} is your top-performing product in ${topProduct.category} with ₹${topProduct.price} price point and ${topProduct.stock} available units.`;
        } else {
          responseText = `Sales performance metrics will be available once customer orders are placed in your store.`;
        }
      } else if (categoryOpportunity) {
        responseText = `In ${categoryOpportunity.category}, your ${categoryOpportunity.name} is the prime candidate for promotion (${categoryOpportunity.reason || 'High stock with healthy margin'}).`;
      } else if (topOpportunity) {
        responseText = `Your ${topOpportunity.name} is a prime candidate for promotion (${topOpportunity.reason}).`;
      } else {
        responseText = `Based on current catalog demand, your inventory is well-balanced across active categories.`;
      }
    }

    // Save updated conversation memory for follow-ups
    if (featuredItem) {
      state.lastProduct = {
        id: featuredItem.productId || featuredItem._id?.toString() || featuredItem.id,
        name: featuredItem.name,
        category: featuredItem.category,
        price: featuredItem.price,
        stock: featuredItem.stock,
        reason: featuredItem.reason,
      };
    }
    if (activeCategory) {
      state.lastCategory = activeCategory;
    } else if (featuredItem?.category) {
      state.lastCategory = featuredItem.category;
    }
    if (requestedPct !== undefined) {
      state.lastDiscountPercentage = requestedPct;
    }
    state.lastIntent = intent;
    state.lastSubIntent = subIntent;
    state.lastAnswer = responseText;
    state.history.push({ role: 'user', content: rawMessage });
    state.history.push({ role: 'assistant', content: responseText });
    if (state.history.length > 8) state.history = state.history.slice(-8);
    saveMerchantMemory(sessionKey, context, state);

    return {
      success: true,
      intent: intent || 'PRODUCT_PROMOTION',
      message: responseText,
      language,
      mode: 'merchant',
      merchantInsights: insights,
      toolsExecuted,
      conversationId: context.conversationId,
    };
  }
}
