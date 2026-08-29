# SellPilot AI — Architecture Specification

## 1. Architecture Overview
- Modular client-server architecture.
- User/Merchant → Next.js → Express.js → AI + Business Logic → MongoDB/Razorpay → Verification → Audit.
- Frontend handles UI.
- Backend handles security, validation, business logic and payments.
- AI handles intent, recommendations and commerce assistance.

## 2. High-Level Architecture
- Next.js + React → REST API → Node.js + Express → Auth → Authorization → AI/Business Logic → MongoDB/Razorpay → Verification → Audit.

## 3. Frontend Architecture
- Handles UI, dashboards, AI chat, product discovery, recommendations, comparison, cart, checkout, campaigns, status, errors, auth and language.
- Stack: Next.js, React, TypeScript, Tailwind CSS.
- Never expose secret API keys.

## 4. Backend Architecture
- Handles authentication, authorization, validation, inventory, permissions, limits, payments, database, audit and AI action validation.
- Stack: Node.js, Express.js, TypeScript, MongoDB, Mongoose, JWT.

## 5. AI Agent Architecture
- Handles intent, product discovery, recommendations, comparison, upselling, cross-selling, merchant growth, campaigns, natural language and multilingual input.
- AI must never bypass backend validation.

## 6. AI Request Flow
- Request → Intent → Context → Data → Recommendation/Response → Action Classification → Permission → Limits → Confirmation → Execution → Verification → Audit → Response.

## 7. Merchant Mode
- Helps merchants analyze products, sales, inventory and opportunities.
- Supports promotion, upselling, cross-selling, campaigns and controlled discounts.
- Business actions require appropriate approval.

## 8. AI Buyer Mode
- Supports product discovery, natural-language search, filtering, comparison, price/availability checks, recommendations, complementary products and checkout.

## 9. Product Catalog Architecture
- Product data: ID, name, description, category, price, inventory, features, related products and status.
- Catalog is the primary product-information source.
- AI must never invent catalog data.

## 10. AI-Readable Catalog
- Products use structured data containing product, category, price, availability, features, related products and benefits.
- Enables AI buyers to discover products naturally.

## 11. Product Discovery Flow
- Requirement → Intent → Requirement Extraction → Catalog Search → Price Filter → Inventory Check → Relevance Check → Ranking → Recommendation.

## 12. Product Recommendation
- Consider requirements, category, price, features, availability, relevance and related products.
- Provide short explanations for important recommendations.

## 13. Inventory Architecture
- Product Request → Find Product → Inventory Check → Available?
- Available → Recommend.
- Unavailable → Suggest Alternative.
- Backend/database is the inventory source of truth.

## 14. Upselling Architecture
- Selected Product → Higher-Value Alternatives → Compare Benefits → Availability → Explain Value → Ask Customer → Decision.
- Must be relevant and non-aggressive.

## 15. Cross-Selling Architecture
- Selected Product → Related Products → Relevance → Availability → Complementary Recommendation → Customer Decision.
- Examples: Camera → Memory Card; Laptop → Bag; Phone → Case; Shoes → Socks.

## 16. Merchant Growth Architecture
- Merchant Data → Sales/Product/Inventory Analysis → Opportunity Detection → Growth Recommendation → Approval → Execution → Verification → Audit.

## 17. Revenue Opportunity Detection
- Use available sales, demand, inventory, categories, customer interest, product relationships, pricing and promotional data.
- Never use invented data.

## 18. Campaign Architecture
- Merchant Data → Opportunity → Campaign Recommendation → Explanation → Limits → Approval → Execution → Verification → Audit.
- Campaign activation requires required approval.

## 19. Discount Architecture
- Requested Discount → Validation → Maximum Limit Check → Within Limit?
- Yes → Approval → Execution.
- No → Reject.
- Backend enforces limits.

## 20. Permission Architecture
- Action → Identify User → Identify Role → Permission Check → Allowed?
- Yes → Continue.
- No → Reject.
- Backend is final authority.

## 21. Authentication Architecture
- Login/Register → Credential Validation → JWT → Authenticated Request → Auth Guard → Protected Resource.
- Invalid authentication is rejected.

## 22. Authorization Architecture
- Backend verifies user identity, role, resource ownership, required permissions and action permissions.
- Frontend and AI are not final authorization authorities.

## 23. API Architecture
- Frontend → HTTP Request → Express Route → Authentication → Authorization → Controller → Business Logic → Database/External API → Validation → Response → Frontend.

## 24. Database Architecture
- MongoDB is the main database.
- Mongoose provides schemas, models, validation and queries.
- Main areas: Users, Products, Orders, Payments, Campaigns and Audit Logs.

## 25. Order Architecture
- Product → Cart → Order Summary → Price Calculation → Customer Confirmation → Backend Validation → Order Creation → Payment → Verification → Status Update.

## 26. Payment Architecture
- Razorpay Test Mode.
- Product → Order Summary → Amount → Customer Confirmation → Backend Validation → Razorpay Order → Checkout → Payment → Backend Verification → Order Update → Audit → Confirmation.

## 27. Payment Security
- Razorpay secret credentials remain on backend.
- Frontend → Backend → Razorpay.
- Never expose Razorpay secret keys to frontend.

## 28. Payment Verification
- Payment Result → Backend Verification → Valid?
- Yes → Verified.
- No → Failed.
- Never trust frontend payment status alone.

## 29. Duplicate Payment Protection
- Payment Request → Existing Transaction Check.
- Existing → Verify Existing Transaction.
- None → Create Transaction.
- Uncertain failure → Verify before retrying.

## 30. Transaction State Architecture
- States: Pending, Processing, Successful, Failed, Cancelled, Verification Required.
- Always report verified backend state.

## 31. Audit Trail Architecture
- Record important commerce/financial actions.
- Store action, actor, role, target, approval, status, reason, timestamp and transaction reference.
- Provides traceability.

## 32. AI Action Safety
- AI Recommendation → Backend Validation → Permission → Limits → Confirmation → Execution → Verification → Audit.
- AI cannot override controls.

## 33. Explainable Actions
- Explain what happens, why it is recommended, amount involved, expected impact and required confirmation.

## 34. Bounded Actions
- Enforce limits for discounts, transaction amounts, products, campaigns and permissions.
- Backend must enforce all limits.

## 35. Gated Actions
- Require appropriate approval for customer payments, campaigns, discounts and financial operations.
- Informational requests normally require no approval.

## 36. Error Handling Architecture
- Request → Validation → Execution → Success/Failure → Safe Response.
- Errors must be clear, safe, understandable and actionable.
- Never expose stack traces or secrets.

## 37. AI Failure Handling
- AI Request → AI Service → Success/Failure.
- On failure: show clear error, never claim success, prevent unauthorized execution and allow safe retry.

## 38. External Service Failure
- External Request → Service Response → Success/Failure.
- On failure: preserve state, avoid duplicates, verify uncertain operations, show safe error and allow retry.

## 39. Multilingual Architecture
- User Input → Language/Intent Understanding → Processing → Selected Language → Response.
- Support English, supported Indian languages, Romanized languages and mixed-language input.

## 40. Conversation Context Architecture
- Maintain relevant recent conversation context.
- Follow-up questions should correctly refer to previous products, requests or results.

## 41. Source of Truth
- Backend/database are authoritative for products, prices, inventory, orders, payments, campaigns, permissions, discounts, transaction status and audit records.
- AI must not override verified data.

## 42. AI vs Backend Responsibilities

### AI
- Intent understanding
- Natural-language understanding
- Product recommendations
- Opportunity detection
- Upselling
- Cross-selling
- Explanations
- Merchant growth suggestions

### Backend
- Authentication
- Authorization
- Validation
- Inventory
- Financial limits
- Payment creation
- Payment verification
- Database updates
- Transaction state
- Audit logging

## 43. Security Architecture
- No frontend secrets.
- No client-side payment verification.
- No unauthorized actions.
- No unverified payment success.
- No duplicate financial operations.
- No bypassing limits or permissions.
- No sensitive data, tokens or credentials exposed.

## 44. Data Protection
- Protect API secrets, Razorpay keys, JWT secrets, database credentials, authentication tokens, private credentials, internal configuration and system prompts.
- Sensitive data stays on trusted backend infrastructure.

## 45. Technology Requirements
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: Node.js, Express.js, TypeScript.
- Database: MongoDB, Mongoose.
- Authentication: JWT.
- Payments: Razorpay Test Mode.
- Prefer free/existing technologies.
- Avoid unnecessary dependencies.

## 46. Architecture Principles
- Security first.
- Backend validation.
- Least privilege.
- Explicit confirmation.
- Deterministic financial logic.
- Explainable recommendations.
- Inventory awareness.
- Transaction verification.
- Duplicate-operation prevention.
- Auditability.
- Clear errors.
- Modular and reusable architecture.
- Minimal dependencies.

## 47. Critical Safety Rules
- AI Recommendation → Backend Validation → Permission → Limits → User/Merchant Confirmation → Execution → Verification → Audit.
- No important financial/commerce operation may skip required safety stages.

## 48. Agentic Commerce Architecture
- Understand → Discover → Recommend → Explain → Ask Permission → Validate → Execute → Verify → Audit.
- Designed as an AI commerce agent, not just a chatbot.

## 49. Failure-Safe Architecture
- Never assume uncertain success.
- Never blindly repeat financial operations.
- Check transaction state.
- Verify backend state.
- Inform the user.
- Allow safe retry.

## 50. Final Architecture Principle
- Understanding → Recommendation → Approval → Validation → Execution → Verification → Audit.
- AI helps users and merchants.
- Backend controls allowed actions.
- Database stores actual state.
- Razorpay Test Mode handles prototype payments.
- All agentic commerce actions remain explainable, bounded, gated, verified and auditable.