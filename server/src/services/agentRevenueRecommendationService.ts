import mongoose from 'mongoose';
import { ProductService } from './productService';
import { config } from '../config/env';

export type RevenueRecommendationType = 'UPSELL' | 'CROSS_SELL';

export interface RevenueCartItemInput {
  productId: string;
  quantity: number;
}

export interface RevenueRecommendation {
  type: RevenueRecommendationType;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  reason: string;
  currentCartTotal: number;
  quantityAdded: number;
  newCartTotal: number;
  explanation: string;
  available: true;
}

export interface CatalogProduct {
  productId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  merchantId?: string;
  relatedProducts: string[];
  features: string[];
  tags: string[];
}

export interface AiRecommendationItem {
  type: string;
  productId: string;
  reason?: string;
}

export type AiRecommendationProvider = (
  cartProducts: CatalogProduct[],
  candidates: CatalogProduct[]
) => Promise<AiRecommendationItem[]>;

let customAiProvider: AiRecommendationProvider | null = null;

export const setAiProvider = (provider: AiRecommendationProvider | null): void => {
  customAiProvider = provider;
};

const isCatalogProduct = (value: any): value is CatalogProduct =>
  value &&
  typeof value.productId === 'string' &&
  typeof value.name === 'string' &&
  typeof value.price === 'number' &&
  Number.isFinite(value.price) &&
  value.price >= 0 &&
  typeof value.category === 'string' &&
  typeof value.available === 'boolean' &&
  Array.isArray(value.relatedProducts) &&
  Array.isArray(value.features) &&
  Array.isArray(value.tags);

export function buildPromptMessages(
  cartProducts: CatalogProduct[],
  candidates: CatalogProduct[]
): { role: 'system' | 'user'; content: string }[] {
  const cartSummary = cartProducts.map((p) => ({
    productId: p.productId,
    name: p.name,
    category: p.category,
    price: p.price,
    features: p.features,
    relatedProducts: p.relatedProducts,
  }));

  const candidateSummary = candidates.map((p) => ({
    productId: p.productId,
    name: p.name,
    category: p.category,
    price: p.price,
    features: p.features,
    tags: p.tags,
  }));

  const systemMessage = `You are an AI Revenue Optimization Agent for SellPilot e-commerce platform.
Analyze the customer's current cart against the available candidate products from our catalog to suggest UPSELL and CROSS_SELL recommendations.

Instructions:
1. UPSELL: Recommend a higher-priced alternative product in the same category that provides more features, premium quality, or better value.
2. CROSS_SELL: Recommend a complementary product (such as accessories, matching gear, or related products) that pairs well with the items in the cart.
3. CRITICAL: You MUST ONLY select productIds from the "Available Candidate Products" list.
4. NEVER invent or hallucinate product IDs, product names, or prices.
5. Provide a short, persuasive reason (max 100 characters) for each recommendation.

Respond with ONLY a valid JSON array in the following format (no markdown, no code blocks):
[
  {
    "type": "UPSELL",
    "productId": "<exact productId from Available Candidate Products>",
    "reason": "<short explanation>"
  },
  {
    "type": "CROSS_SELL",
    "productId": "<exact productId from Available Candidate Products>",
    "reason": "<short explanation>"
  }
]`;

  const userMessage = `Current Cart Items:
${JSON.stringify(cartSummary, null, 2)}

Available Candidate Products (In Stock and Active):
${JSON.stringify(candidateSummary, null, 2)}`;

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage },
  ];
}

export function buildGeminiPrompt(
  cartProducts: CatalogProduct[],
  candidates: CatalogProduct[]
): string {
  const messages = buildPromptMessages(cartProducts, candidates);
  return `${messages[0].content}\n\n${messages[1].content}`;
}

export type AiProviderType = 'nvidia' | 'gemini' | 'none';

export function resolveAiProvider(): AiProviderType {
  const effectiveKey = (config.ai.apiKey !== undefined ? config.ai.apiKey : process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  const explicit = (config.ai.provider !== undefined ? config.ai.provider : process.env.AI_PROVIDER || '').trim().toLowerCase();
  
  if (explicit === 'gemini') return 'gemini';
  if (explicit === 'nvidia') return 'nvidia';

  const serviceUrl = (config.ai.serviceUrl !== undefined ? config.ai.serviceUrl : process.env.AI_SERVICE_URL || '').trim().toLowerCase();
  if (serviceUrl.includes('googleapis.com') || serviceUrl.includes('gemini')) {
    return 'gemini';
  }
  if (serviceUrl.includes('nvidia') || serviceUrl.includes('/v1') || (serviceUrl && effectiveKey)) {
    return 'nvidia';
  }

  if (process.env.GEMINI_API_KEY && !config.ai.apiKey && !process.env.AI_API_KEY) {
    return 'gemini';
  }

  if (effectiveKey) {
    return 'nvidia';
  }

  return 'none';
}

export async function callNvidiaChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 500,
  temperature = 0.2
): Promise<string> {
  const apiKey = (config.ai.apiKey !== undefined ? config.ai.apiKey : process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || '').trim();
  const rawServiceUrl = (config.ai.serviceUrl !== undefined ? config.ai.serviceUrl : process.env.AI_SERVICE_URL || 'https://integrate.api.nvidia.com/v1').trim();
  const model = (config.ai.model || process.env.AI_MODEL || 'openai/gpt-oss-20b').trim();

  if (!apiKey) {
    throw new Error('AI_SERVICE_NOT_CONFIGURED');
  }

  const endpoint = rawServiceUrl.endsWith('/chat/completions')
    ? rawServiceUrl
    : `${rawServiceUrl.replace(/\/+$/, '')}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: HTTP ${response.status}`);
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning_content || '';
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callNvidiaNimApi(
  cartProducts: CatalogProduct[],
  candidates: CatalogProduct[]
): Promise<string> {
  const messages = buildPromptMessages(cartProducts, candidates);
  return await callNvidiaChatCompletion(messages as any, 500, 0.1);
}

export async function callGeminiApi(prompt: string): Promise<string> {
  const apiKey = (config.ai.apiKey !== undefined ? config.ai.apiKey : process.env.GEMINI_API_KEY || '').trim();
  const serviceUrl = (config.ai.serviceUrl !== undefined ? config.ai.serviceUrl : process.env.AI_SERVICE_URL || '').trim();

  const endpoint =
    serviceUrl ||
    (apiKey
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      : '');

  if (!endpoint || (!serviceUrl && !apiKey)) {
    throw new Error('AI_SERVICE_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI API error: HTTP ${response.status}`);
    }

    const data: any = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.text ||
      '';

    return candidateText;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function extractJsonArray(rawText: string): any[] {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI output is empty');
  }
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Find array boundaries [ ... ]
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('AI output is not a JSON array');
  }
  return parsed;
}

export class AgentRevenueRecommendationService {
  public static async recommend(
    cartItems: RevenueCartItemInput[],
    authenticatedMerchantId?: string
  ): Promise<RevenueRecommendation[]> {
    // 1. Fetch authoritative catalog
    const catalog = (await ProductService.getAICatalog(authenticatedMerchantId)).filter(isCatalogProduct);
    const byId = new Map(catalog.map((product) => [product.productId, product]));
    const cartIds = new Set(cartItems.map((item) => item.productId));
    const cartProducts = cartItems.map((item) => byId.get(item.productId));

    // Unknown, inactive, malformed, or cross-merchant cart products are unsafe to reason about.
    if (
      cartProducts.some((product) => !product) ||
      cartProducts.some((product) => authenticatedMerchantId && product!.merchantId !== authenticatedMerchantId)
    ) {
      throw new Error('CART_NOT_GROUNDED_IN_CATALOG');
    }

    const currentCartTotal = cartItems.reduce((acc, item) => {
      const prod = byId.get(item.productId);
      return acc + (prod ? prod.price * item.quantity : 0);
    }, 0);

    const merchantIds = new Set(cartProducts.map((product) => product!.merchantId).filter(Boolean));
    if (merchantIds.size > 1) {
      throw new Error('CART_SPANS_MERCHANTS');
    }

    const merchantId = authenticatedMerchantId || [...merchantIds][0];
    const scopedCatalog = catalog.filter((product) => !merchantId || product.merchantId === merchantId);

    // Candidates must be available (in stock + active) and not already in the cart
    const availableCandidates = scopedCatalog.filter(
      (product) =>
        product.available &&
        !cartIds.has(product.productId) &&
        (!merchantId || product.merchantId === merchantId)
    );

    if (availableCandidates.length === 0) {
      return [];
    }

    // 2. Call AI provider (Custom test provider, NVIDIA NIM, or Gemini)
    let rawAiResults: AiRecommendationItem[] = [];
    try {
      if (customAiProvider) {
        rawAiResults = await customAiProvider(cartProducts as CatalogProduct[], availableCandidates);
      } else {
        const provider = resolveAiProvider();
        if (provider === 'nvidia') {
          const rawResponseText = await callNvidiaNimApi(
            cartProducts as CatalogProduct[],
            availableCandidates
          );
          rawAiResults = extractJsonArray(rawResponseText);
        } else if (provider === 'gemini') {
          const prompt = buildGeminiPrompt(cartProducts as CatalogProduct[], availableCandidates);
          const aiResponseText = await callGeminiApi(prompt);
          rawAiResults = extractJsonArray(aiResponseText);
        } else {
          throw new Error('AI_SERVICE_NOT_CONFIGURED');
        }
      }
    } catch (aiError) {
      // If AI fails, times out, or returns unparseable output, fail safely
      return [];
    }

    if (!Array.isArray(rawAiResults) || rawAiResults.length === 0) {
      return [];
    }

    // 3. Grounding and validation of AI output against authoritative catalog
    const candidateById = new Map(availableCandidates.map((c) => [c.productId, c]));
    const recommendations: RevenueRecommendation[] = [];
    const seenProductIds = new Set<string>();

    for (const item of rawAiResults) {
      if (!item || typeof item !== 'object') continue;
      if (item.type !== 'UPSELL' && item.type !== 'CROSS_SELL') continue;
      if (typeof item.productId !== 'string') continue;
      if (seenProductIds.has(item.productId)) continue;
      if (cartIds.has(item.productId)) continue;

      // Must strictly exist in available candidate products
      const candidate = candidateById.get(item.productId);
      if (!candidate) {
        // Hallucinated or non-candidate product ID: REJECT
        continue;
      }

      // Must strictly belong to the active authenticated merchant store
      if (merchantId && candidate.merchantId && candidate.merchantId !== merchantId) {
        continue;
      }
      if (authenticatedMerchantId && candidate.merchantId && candidate.merchantId !== authenticatedMerchantId) {
        continue;
      }

      // Must be available and have valid price
      if (!candidate.available || !Number.isFinite(candidate.price) || candidate.price < 0) {
        // Unavailable product: REJECT
        continue;
      }

      if (item.type === 'UPSELL') {
        // Upsell must match category of at least one cart item and have a higher price
        const cartItemInSameCategory = (cartProducts as CatalogProduct[]).find(
          (cp) => cp.category.toLowerCase() === candidate.category.toLowerCase()
        );
        if (!cartItemInSameCategory || candidate.price <= cartItemInSameCategory.price) {
          continue;
        }
      }

      const quantityAdded = 1;
      const newCartTotal = currentCartTotal + candidate.price * quantityAdded;
      const cleanReason =
        typeof item.reason === 'string' && item.reason.trim()
          ? item.reason.trim().slice(0, 150)
          : item.type === 'UPSELL'
          ? `A premium upgrade in ${candidate.category}.`
          : `Complements items in your cart.`;

      const explanation = `Adding ${quantityAdded}x "${candidate.name}" (₹${candidate.price.toLocaleString('en-IN')}) because: ${cleanReason}. Your cart total will increase from ₹${currentCartTotal.toLocaleString('en-IN')} to ₹${newCartTotal.toLocaleString('en-IN')}.`;

      // Authoritatively populate all product fields from catalog candidate (NEVER trust AI)
      seenProductIds.add(candidate.productId);
      recommendations.push({
        type: item.type,
        productId: candidate.productId,
        productName: candidate.name,
        price: candidate.price,
        currency: (candidate as any).currency || 'INR',
        reason: cleanReason,
        currentCartTotal,
        quantityAdded,
        newCartTotal,
        explanation,
        available: true,
      });

      if (recommendations.length >= 5) break;
    }

    return recommendations;
  }
}
