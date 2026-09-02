import mongoose from 'mongoose';
import crypto from 'crypto';
import { IntentService, IntentResult, ExtractedRequirements } from './intentService';
import { ToolRegistry, AgentToolContext } from './toolRegistry';
import { ToolExecutionService, ToolExecutionResponse } from './toolExecutionService';
import { ConversationService } from './conversationService';
import { ConversationCartService } from './conversationCartService';
import { AuditService } from './auditService';
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
    const sessionKey = params.conversationId || params.userId || 'default_session';

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

    const context: AgentToolContext = {
      userId: params.userId,
      merchantId: params.merchantId || (mode === 'merchant' ? params.userId : undefined),
      userRole: params.userRole || (mode === 'merchant' ? 'merchant' : 'customer'),
      conversationId: conversation?._id?.toString() || params.conversationId,
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

      // Handle ordinal references (e.g. "add the second one")
      if (requirements.targetOrdinal) {
        const recentList = sessionRecentProducts.get(sessionKey) || [];
        const index = requirements.targetOrdinal - 1;
        if (recentList[index]) {
          targetProductFromContext = recentList[index];
          targetIdentifier = targetProductFromContext.id;
        }
      }

      // If no ordinal matched, check if keywords or category identify a single item or recent item
      if (!targetIdentifier) {
        const recentList = sessionRecentProducts.get(sessionKey) || [];
        if (recentList.length > 0) {
          targetProductFromContext = recentList[0];
          targetIdentifier = targetProductFromContext.id;
        } else {
          targetIdentifier = requirements.category || 'Pro Running Shoes';
        }
      }

      // Step A: Check inventory tool
      const invResult = await ToolExecutionService.executeTool({
        toolName: 'checkInventory',
        arguments: {
          productId: mongoose.Types.ObjectId.isValid(targetIdentifier) ? targetIdentifier : undefined,
          name: !mongoose.Types.ObjectId.isValid(targetIdentifier) ? targetIdentifier : undefined,
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
          productId: mongoose.Types.ObjectId.isValid(targetIdentifier) ? targetIdentifier : undefined,
          name: !mongoose.Types.ObjectId.isValid(targetIdentifier) ? targetIdentifier : undefined,
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
            items: [addResult.data.addedItem],
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

        sessionRecentProducts.set(
          sessionKey,
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
      const recentList = sessionRecentProducts.get(sessionKey) || [];
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
      const recentList = sessionRecentProducts.get(sessionKey) || [];
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
      sessionRecentProducts.set(
        sessionKey,
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
    const { intent, rawMessage } = intentResult;
    const toolsExecuted: ToolExecutionSummary[] = [];

    // Guardrail Check Tool: validateDiscount
    const discountMatch = rawMessage.match(/(\d+)%\s*discount/i);
    if (discountMatch) {
      const requestedPct = parseInt(discountMatch[1], 10);
      const discountValidationRes = await ToolExecutionService.executeTool({
        toolName: 'validateDiscount',
        arguments: { discountPercentage: requestedPct, merchantId: context.merchantId },
        context,
      });

      if (discountValidationRes.success && discountValidationRes.data) {
        toolsExecuted.push({
          tool: 'validateDiscount',
          arguments: discountValidationRes.arguments,
          success: true,
          resultSummary: `Validated ${requestedPct}% discount. Allowed: ${discountValidationRes.data.valid} (Max: ${discountValidationRes.data.maxAllowed}%).`,
          executionTimeMs: discountValidationRes.executionTimeMs,
        });

        if (!discountValidationRes.data.valid) {
          return {
            success: false,
            intent: 'DISCOUNT_RECOMMENDATION',
            message: `I cannot recommend an ${requestedPct}% discount because it exceeds your configured limit of ${discountValidationRes.data.maxAllowed}%.`,
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
    const topCrossSell = insights.crossSellOpportunities?.[0];
    const topUpsell = insights.upsellOpportunities?.[0];
    const topProduct = insights.topProducts?.[0];

    let responseText = '';
    if (intent === 'UPSELL_OPPORTUNITY' && topUpsell) {
      responseText = `Consider offering ${topUpsell.premiumName} as a premium alternative when customers view ${topUpsell.name} (₹${topUpsell.priceDiff} difference).`;
    } else if (intent === 'CROSS_SELL_OPPORTUNITY' && topCrossSell) {
      responseText = `We recommend pairing ${topCrossSell.name} with ${topCrossSell.relatedName} as a complementary bundle.`;
    } else if (intent === 'PRODUCT_PERFORMANCE' && topProduct) {
      responseText = `${topProduct.name} is your top-performing product in ${topProduct.category} with ₹${topProduct.price} price point and ${topProduct.stock} available units.`;
    } else if (topOpportunity && topCrossSell) {
      responseText = `${topOpportunity.name} has strong sales potential and high inventory. I recommend promoting it with ${topCrossSell.relatedName} as a cross-sell.`;
    } else if (topOpportunity) {
      responseText = `Your ${topOpportunity.name} is a prime candidate for promotion (${topOpportunity.reason}).`;
    } else {
      responseText = `Based on current catalog demand, your inventory is well-balanced across active categories.`;
    }

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
