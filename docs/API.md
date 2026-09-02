SellPilot AI — API Specification
1. API Overview

Project: SellPilot AI
Track: Razorpay Track 01 — AI Growth & Agentic Commerce
Base URL: /api

API Principles
REST API
JSON request/response format
JWT authentication where required
Backend is the final authority for sensitive operations
Razorpay Test Mode for payments
All financial operations must be verified
Important financial actions must be auditable
No secret API keys exposed to frontend
2. Authentication
POST /api/auth/register

Create a new merchant/customer account.

Request:

{
  "name": "John",
  "email": "john@example.com",
  "password": "password"
}

Response:

{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "USER_ID",
    "name": "John",
    "email": "john@example.com"
  },
  "token": "JWT_TOKEN"
}
POST /api/auth/login

Authenticate a user.

Request:

{
  "email": "john@example.com",
  "password": "password"
}

Response:

{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "USER_ID",
    "name": "John",
    "role": "merchant"
  }
}
3. AI Chatbot API
POST /api/ai/chat

Main SellPilot AI conversational endpoint.

Authentication: Required

Request:

{
  "message": "I need running shoes under 3000",
  "mode": "buyer",
  "language": "en",
  "conversationId": "CONVERSATION_ID"
}
Supported Modes
buyer
merchant
Buyer Example

Request:

{
  "message": "I need running shoes under 3000",
  "mode": "buyer",
  "language": "en"
}

Response:

{
  "success": true,
  "intent": "product_search",
  "message": "I found these running shoes under ₹3000.",
  "products": []
}
Merchant Example

Request:

{
  "message": "What should I promote?",
  "mode": "merchant",
  "language": "en"
}

Response:

{
  "success": true,
  "intent": "growth_recommendation",
  "message": "Running Shoes are a strong promotion opportunity. Consider cross-selling Sports Socks."
}
4. Product API
GET /api/products

Return merchant products.

Query Parameters:

category
minPrice
maxPrice
search
available

Example:

GET /api/products?search=running%20shoes&maxPrice=3000&available=true
GET /api/products/:id

Return details of a specific product.

Response:

{
  "success": true,
  "product": {
    "id": "PRODUCT_ID",
    "name": "Pro Running Shoes",
    "description": "Running shoes for daily training",
    "category": "Shoes",
    "price": 2999,
    "inventory": 20,
    "features": [
      "Lightweight",
      "Breathable",
      "Cushioned"
    ]
  }
}
POST /api/products

Create a product.

Authentication: Merchant required

Request:

{
  "name": "Pro Running Shoes",
  "description": "Lightweight running shoes",
  "category": "Shoes",
  "price": 2999,
  "inventory": 20,
  "features": [
    "Lightweight",
    "Breathable"
  ]
}
PUT /api/products/:id

Update a product.

Authentication: Merchant required

DELETE /api/products/:id

Delete a product.

Authentication: Merchant required

5. AI-Readable Catalog API
GET /api/catalog/ai

Return structured product information optimized for AI discovery.

Response:

{
  "success": true,
  "products": [
    {
      "id": "PRODUCT_ID",
      "name": "Pro Running Shoes",
      "category": "Shoes",
      "price": 2999,
      "currency": "INR",
      "available": true,
      "inventory": 20,
      "features": [
        "Lightweight",
        "Breathable",
        "Cushioned"
      ],
      "relatedProducts": [
        "SPORTS_SOCKS_ID"
      ]
    }
  ]
}
6. Product Recommendation API
POST /api/recommendations

Generate product recommendations.

Request:

{
  "query": "running shoes under 3000",
  "category": "Shoes",
  "maxPrice": 3000
}

Response:

{
  "success": true,
  "recommendations": [
    {
      "productId": "PRODUCT_ID",
      "reason": "Matches your running requirement and is within your ₹3000 budget."
    }
  ]
}
7. Upsell API
POST /api/recommendations/upsell

Find a higher-value relevant product.

Request:

{
  "productId": "PRODUCT_ID"
}

Response:

{
  "success": true,
  "recommendation": {
    "productId": "PREMIUM_PRODUCT_ID",
    "reason": "This product provides twice the storage for ₹2000 more."
  }
}
8. Cross-Sell API
POST /api/recommendations/cross-sell

Find complementary products.

Request:

{
  "productId": "PRODUCT_ID"
}

Response:

{
  "success": true,
  "recommendations": [
    {
      "productId": "RELATED_PRODUCT_ID",
      "reason": "This product is commonly useful with your selected item."
    }
  ]
}
9. Merchant Growth API
GET /api/merchant/insights

Return merchant growth information.

Authentication: Merchant required

Response:

{
  "success": true,
  "insights": {
    "topProducts": [],
    "lowPerformingProducts": [],
    "promotionOpportunities": [],
    "crossSellOpportunities": [],
    "upsellOpportunities": []
  }
}
10. Discount Validation API
POST /api/merchant/discount/validate

Validate a proposed discount.

Request:

{
  "productId": "PRODUCT_ID",
  "discountPercentage": 10
}

Response:

{
  "success": true,
  "allowed": true,
  "discountPercentage": 10
}
Exceeding Limit
{
  "success": false,
  "allowed": false,
  "message": "Discount exceeds the configured merchant limit."
}
12. Campaign API
POST /api/campaigns

Create a campaign proposal.

Authentication: Merchant required

Request:

{
  "name": "Running Shoes Campaign",
  "productIds": [
    "PRODUCT_ID"
  ],
  "discountPercentage": 10
}

The campaign must remain pending approval when merchant approval is required.

POST /api/campaigns/:id/approve

Approve a campaign.

Authentication: Merchant required

Response:

{
  "success": true,
  "status": "approved"
}
POST /api/campaigns/:id/activate

Activate an approved campaign.

Authentication: Merchant required

Response:

{
  "success": true,
  "status": "active"
}

The system must verify successful activation before reporting success.

13. Cart API
Cart operations are exposed through the authenticated agent tool endpoint:

POST /api/ai/tools/execute

Use `toolName` values `addToCart`, `getCart`, `removeFromCart`, and `calculateCart`. Cart identity is derived from the authenticated user; client-supplied user IDs are ignored.

14. Checkout API
POST /api/checkout/prepare

Prepare a checkout before payment.

Request:

{
  "items": [
    { "productId": "PRODUCT_ID", "quantity": 1 }
  ],
  "discountPercentage": 0
}

Response:

{
  "success": true,
  "checkout": {
    "subtotal": 2999,
    "discount": 0,
    "total": 2999,
    "currency": "INR"
  }
}

The total must be calculated by the backend.

15. Payment API
POST /api/payment/create-order

Create a Razorpay Test Mode order.

Authentication: Required

Request:

{
  "orderId": "ORDER_ID"
}

Response:

{
  "success": true,
  "orderId": "RAZORPAY_ORDER_ID",
  "razorpayOrderId": "RAZORPAY_ORDER_ID",
  "internalOrderId": "ORDER_ID",
  "amount": 2999,
  "currency": "INR",
  "keyId": "rzp_test_PUBLIC_KEY",
  "testMode": true
}

The backend must validate the actual cart total instead of trusting the frontend amount.

POST /api/payment/verify

Verify a Razorpay payment.

Request:

{
  "razorpayOrderId": "ORDER_ID",
  "razorpayPaymentId": "PAYMENT_ID",
  "razorpaySignature": "SIGNATURE"
}

Response:

{
  "success": true,
  "verified": true,
  "status": "paid"
}

A transaction must not be marked as paid unless backend verification succeeds.

GET /api/payment/:orderId/status

Check payment status.

Response:

{
  "success": true,
  "status": "paid"
}

Possible statuses:

created
pending
paid
failed
cancelled

GET /api/orders/:orderId/timeline

Return the recorded, ownership-protected transaction events for an order. The response includes the server-issued `correlationId`, `eventType`, `actorType`, status, timestamp, and safe entity references. It never returns payment secrets or private agent reasoning.

Authentication: Required. The caller must own the order, belong to its merchant, or be an admin.
16. Order API
POST /api/orders

Create a pending order before payment. The server recalculates prices and inventory from the catalog.

Request:

{
  "items": [
    { "productId": "PRODUCT_ID", "quantity": 1 }
  ],
  "shippingAddress": {},
  "idempotencyKey": "UNIQUE_CHECKOUT_KEY",
  "idempotencyFingerprint": "REQUEST_FINGERPRINT"
}

{
  "paymentOrderId": "RAZORPAY_ORDER_ID"
}

The backend must verify payment status before creating a paid order.

GET /api/orders

Return the user's orders.

GET /api/orders/:id

Return order details.

17. Audit Trail API
POST /api/audit

Record an important system action.

Request:

{
  "action": "payment_verified",
  "status": "success",
  "referenceId": "PAYMENT_ID",
  "details": {
    "amount": 2999
  }
}
GET /api/audit

Return audit records.

Authentication: Merchant/Admin required

Audit Information May Include:

action
user
role
status
timestamp
referenceId
amount
approval
reason
18. Conversation API
GET /api/conversations

Return recent AI conversations.

GET /api/conversations/:id

Return conversation history.

POST /api/conversations

Create a conversation.

Request:

{
  "mode": "buyer",
  "language": "en"
}
19. Health Check API
GET /api/health

Check server availability.

Response:

{
  "success": true,
  "status": "healthy"
}
20. Authentication Rules

Protected endpoints require:

Authorization: Bearer <JWT_TOKEN>

The backend must:

Validate JWT
Validate user identity
Validate user role
Validate permissions
Reject unauthorized requests
Never bypass authentication
21. Financial Safety Rules

All payment-related endpoints must:

Validate product information
Validate inventory
Calculate prices on the backend
Validate discounts
Respect transaction limits
Require customer confirmation where required
Use Razorpay Test Mode
Keep Razorpay secret keys on the backend
Verify payment signatures
Prevent duplicate payment operations
Verify uncertain payment states
Never mark unpaid transactions as paid
Record important financial actions
22. Merchant Approval Rules

Actions that can affect merchant operations must follow:

AI Recommendation
        ↓
Merchant Review
        ↓
Merchant Approval
        ↓
Validation
        ↓
Execution
        ↓
Verification
        ↓
Audit

AI recommendations must never automatically bypass merchant approval.

23. Error Response Format

All API errors should use a consistent format:

{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
Common Error Codes
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INVALID_REQUEST
PRODUCT_UNAVAILABLE
OUT_OF_STOCK
DISCOUNT_LIMIT_EXCEEDED
APPROVAL_REQUIRED
PAYMENT_FAILED
PAYMENT_NOT_VERIFIED
DUPLICATE_OPERATION
AI_SERVICE_UNAVAILABLE
INTERNAL_ERROR
24. Important API Safety Rules
Never trust financial values sent by the frontend.
Never expose Razorpay secret keys.
Never expose JWT secrets.
Never mark an unpaid transaction as paid.
Never execute an unapproved merchant action.
Never exceed configured financial limits.
Never recommend unavailable products as available.
Never create duplicate payment operations.
Always verify payment results on the backend.
Always validate inventory before checkout.
Always validate discounts on the backend.
Always verify uncertain transaction states.
Always record important financial actions.
Never claim an API action succeeded unless it actually succeeded.
Never return fabricated product, order, payment, or campaign information.
25. API Flow
User
 ↓
SellPilot AI
 ↓
Intent Understanding
 ↓
Catalog / Merchant Data
 ↓
Recommendation
 ↓
User / Merchant Approval
 ↓
Backend Validation
 ↓
Razorpay / Commerce API
 ↓
Verification
 ↓
Audit Trail
 ↓
Final Response
26. Technology Requirements

The API layer should use the project's existing backend stack.

Node.js
Express.js
TypeScript
MongoDB
Mongoose
JWT
Razorpay Test Mode

No unnecessary dependencies should be introduced.

The frontend must never directly access Razorpay secret credentials.

The backend remains the final authority for authentication, authorization, inventory, pricing, discount limits, payment verification, transaction state, and financial safety.