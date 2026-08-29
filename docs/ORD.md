# SellPilot AI — ORD (Operational Requirements Document)

## 1. Project Overview

- **Project:** SellPilot AI
- **Razorpay Track:** Track 01 — AI Growth & Agentic Commerce
- **Goal:** Help merchants grow revenue and make products discoverable and transactable by AI buyers.
- **Payment:** Razorpay Test Mode
- **Primary Users:** Merchants and AI Buyers / Customers

## 2. Business Objectives

- Increase merchant revenue.
- Improve product discovery.
- Enable AI-powered product recommendations.
- Enable relevant upselling.
- Enable relevant cross-selling.
- Help merchants identify growth opportunities.
- Enable controlled agentic commerce.
- Keep financial actions safe and auditable.

## 3. User Types

### Merchant

- Manage products.
- View product information.
- Identify products to promote.
- Receive growth recommendations.
- Receive campaign recommendations.
- Receive discount recommendations.
- Approve business actions.
- View important activity.

### Customer / AI Buyer

- Discover products.
- Search using natural language.
- Compare products.
- Check prices.
- Check availability.
- Receive recommendations.
- Accept upsell recommendations.
- Accept cross-sell recommendations.
- Complete checkout.
- View payment status.

## 4. Core Operations

- Product discovery.
- Product recommendation.
- Product comparison.
- Inventory checking.
- Upselling.
- Cross-selling.
- Merchant growth analysis.
- Campaign recommendation.
- Discount recommendation.
- Campaign approval.
- Checkout.
- Payment processing.
- Payment verification.
- Order confirmation.
- Audit logging.

## 5. Merchant Growth Operations

The system should:

- Analyze available product data.
- Identify revenue opportunities.
- Identify products worth promoting.
- Identify possible upsell opportunities.
- Identify possible cross-sell opportunities.
- Recommend campaigns.
- Recommend controlled discounts.
- Explain why an opportunity is recommended.
- Require merchant approval for configured business actions.

## 6. AI Buyer Operations

The system should:

- Understand customer intent.
- Search the product catalog.
- Filter by requirements.
- Check price.
- Check inventory.
- Compare products.
- Recommend relevant products.
- Suggest useful upsells.
- Suggest useful cross-sells.
- Assist with checkout.
- Communicate verified payment status.

## 7. Product Requirements

Each product should support information such as:

- Product ID.
- Product name.
- Description.
- Category.
- Price.
- Inventory.
- Features.
- Related products.
- Product status.

Rules:

- Product information must come from the application catalog.
- The AI must not invent product information.
- The AI must not invent prices.
- The AI must not invent inventory.
- The AI must not invent product features.

## 8. Product Discovery Requirements

When a customer requests a product:

- Understand the request.
- Extract relevant requirements.
- Search the catalog.
- Filter by category.
- Filter by price.
- Filter by features.
- Check availability.
- Rank relevant products.
- Return suitable recommendations.

Example:

Customer: `I need running shoes under ₹3000`

System:

- Identify category = Running Shoes.
- Identify maximum price = ₹3000.
- Check available products.
- Return matching products.

## 9. Recommendation Requirements

Recommendations should:

- Match customer requirements.
- Respect price requirements.
- Respect inventory.
- Be relevant.
- Use actual catalog information.
- Provide a short explanation when useful.

## 10. Upselling Requirements

The system may recommend higher-value products when:

- The product is relevant.
- The product provides additional value.
- The product is available.
- The price difference is clear.
- The recommendation is not misleading or aggressive.

The customer makes the final decision.

## 11. Cross-Selling Requirements

The system may recommend complementary products.

Examples:

- Camera → Memory Card.
- Laptop → Laptop Bag.
- Phone → Phone Case.
- Running Shoes → Sports Socks.

Rules:

- Product must be relevant.
- Product must be available.
- Recommendation should provide value.
- Recommendations must not become spam.

## 12. Inventory Requirements

Before recommending a product for purchase:

- Check inventory.
- Confirm availability.
- Do not recommend unavailable products as available.
- Suggest alternatives when possible.

Backend/database inventory is the source of truth.

## 13. Campaign Requirements

Campaign workflow:

- Identify opportunity.
- Recommend campaign.
- Explain campaign.
- Check configured limits.
- Request merchant approval.
- Execute approved campaign.
- Verify execution.
- Record action.

Campaigns must not be activated without required approval.

## 14. Discount Requirements

The system must:

- Respect configured discount limits.
- Validate requested discounts.
- Reject discounts exceeding limits.
- Suggest safer alternatives when possible.
- Require merchant approval where configured.

Example:

`80% discount requested` → Reject if maximum allowed limit is lower.

## 15. Payment Requirements

Payment workflow:

1. Product selection.
2. Cart / order summary.
3. Final price calculation.
4. Customer confirmation.
5. Backend validation.
6. Razorpay Test Mode order creation.
7. Razorpay checkout.
8. Payment result.
9. Backend payment verification.
10. Order status update.
11. Audit logging.
12. Confirmation.

## 16. Payment Safety Requirements

- Use Razorpay Test Mode.
- Keep Razorpay secret keys on the backend.
- Never expose secret keys to the frontend.
- Verify payment on the backend.
- Never mark an unpaid order as paid.
- Never claim an unverified payment succeeded.
- Never automatically duplicate a payment.
- Verify uncertain transactions before retrying.

## 17. Confirmation Requirements

Customer confirmation is required for configured financial actions.

Example:

`Your total is ₹2,999. Ready to continue to payment?`

Payment must not start until the required confirmation is received.

Casual messages must not automatically be treated as financial authorization.

## 18. Transaction Requirements

Transaction states may include:

- Pending.
- Processing.
- Successful.
- Failed.
- Cancelled.
- Verification Required.

The application must use verified backend state when reporting transaction status.

## 19. Duplicate Operation Prevention

If an operation times out or its result is uncertain:

- Do not immediately repeat the operation.
- Check existing transaction status.
- Verify backend state.
- Continue only when safe.

This is especially important for financial operations.

## 20. Authentication Requirements

- Users must authenticate before protected operations.
- Authentication should use JWT.
- Protected APIs must use authentication middleware.
- Invalid authentication must be rejected.
- Authentication must not be bypassed.

## 21. Authorization Requirements

The backend must verify:

- User identity.
- User role.
- Resource ownership.
- Required permissions.
- Action permissions.

Frontend and AI decisions must not be treated as final authorization.

## 22. AI Safety Requirements

The AI may:

- Understand intent.
- Understand natural language.
- Recommend products.
- Recommend growth opportunities.
- Recommend upsells.
- Recommend cross-sells.
- Explain recommendations.

The AI must not:

- Override backend validation.
- Override financial limits.
- Override permissions.
- Claim unverified success.
- Execute unsupported operations.

## 23. Explainable Actions

Important actions must clearly communicate:

- What will happen.
- Why it is recommended.
- Amount involved.
- Expected impact.
- Required approval or confirmation.

## 24. Bounded Actions

Actions must respect:

- Merchant limits.
- Discount limits.
- Transaction limits.
- Product limits.
- Permission limits.
- Business rules.

Backend validation is mandatory.

## 25. Gated Actions

Actions requiring approval or confirmation include:

- Customer payment.
- Checkout.
- Campaign activation.
- Discount activation.
- Other configured financial or business operations.

Informational requests normally do not require approval.

## 26. Audit Requirements

Important actions should record:

- Action.
- Actor.
- User role.
- Target.
- Approval.
- Status.
- Reason.
- Timestamp.
- Transaction reference.
- Relevant operation details.

Audit logs provide traceability and accountability.

## 27. Multilingual Requirements

The agent should support:

- Application-selected language.
- Supported Indian languages.
- Romanized Indian languages.
- Mixed-language input.
- Phonetic regional-language input.

Examples:

- `nanage running shoes beku`
- `mujhe shoes chahiye`
- `enakku shoe venum`
- `naaku shoes kavali`

The response should follow the selected application language.

## 28. Conversation Requirements

The agent should maintain relevant recent context.

Example:

Customer: `I need running shoes.`

Agent: Shows running shoes.

Customer: `Which is cheapest?`

Agent: Understands that the question refers to the displayed running shoes.

## 29. Failure Requirements

The system must safely handle:

- Catalog failures.
- Inventory failures.
- Campaign failures.
- Payment failures.
- Network failures.
- Authentication failures.
- Permission failures.
- AI service failures.
- Verification failures.

The system must:

- Clearly communicate failures.
- Never claim success when an operation failed.
- Preserve state where possible.
- Avoid duplicate operations.
- Allow safe retry when possible.

## 30. Security Requirements

The system must never expose:

- API keys.
- Razorpay secret keys.
- Private keys.
- JWT secrets.
- Authentication tokens.
- Payment secrets.
- Database credentials.
- Internal credentials.
- Secret configuration.
- Internal prompts.

Sensitive information must remain on trusted backend infrastructure.

## 31. Source of Truth

The backend/database is the source of truth for:

- Products.
- Prices.
- Inventory.
- Orders.
- Payments.
- Campaigns.
- Discounts.
- Permissions.
- Transaction status.
- Audit records.

AI-generated information must never override verified application data.

## 32. AI vs Backend Responsibilities

### AI

- Intent understanding.
- Natural-language understanding.
- Product discovery assistance.
- Recommendations.
- Upselling.
- Cross-selling.
- Growth suggestions.
- Explanations.

### Backend

- Authentication.
- Authorization.
- Validation.
- Inventory validation.
- Financial limits.
- Payment creation.
- Payment verification.
- Database updates.
- Transaction state.
- Security.
- Audit logging.
- Final execution authority.

## 33. Technology Requirements

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.

### Backend

- Node.js.
- Express.js.
- TypeScript.

### Database

- MongoDB.
- Mongoose.

### Authentication

- JWT.

### Payment

- Razorpay Test Mode.

### Principle

- Prefer free or already available technologies.
- Avoid unnecessary paid services.
- Avoid unnecessary dependencies.

## 34. Core Agent Workflow

```text
Understand User
      ↓
Analyze Information
      ↓
Identify Product / Opportunity
      ↓
Recommend
      ↓
Explain
      ↓
Request Permission
      ↓
Validate
      ↓
Execute
      ↓
Verify
      ↓
Audit