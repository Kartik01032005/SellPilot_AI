# SellPilot AI — Tasks

## 1. Project Setup

- [x] Create project repository.
- [x] Configure frontend.
- [x] Configure backend.
- [x] Configure TypeScript.
- [x] Configure environment variables.
- [x] Configure Git and GitHub.
- [x] Create development branches.
- [x] Add basic project documentation.

## 2. Frontend Setup

- [x] Set up Next.js application.
- [x] Configure React.
- [x] Configure Tailwind CSS.
- [x] Create responsive layout.
- [x] Create navigation.
- [x] Create authentication pages.
- [x] Create merchant dashboard.
- [x] Create customer interface.
- [x] Create AI chat interface.
- [x] Create product listing UI.
- [x] Create product details UI.
- [x] Create cart UI.
- [x] Create checkout UI.
- [x] Create payment status UI.
- [x] Create campaign approval UI.
- [x] Create error and loading states.

## 3. Backend Setup

- [x] Set up Node.js.
- [x] Set up Express.js.
- [x] Configure TypeScript.
- [x] Configure environment variables.
- [x] Create API routes.
- [x] Create controllers.
- [x] Create services.
- [x] Create middleware.
- [x] Add centralized error handling.
- [x] Add request validation.

## 4. Authentication

- [x] Create user registration.
- [x] Create user login.
- [x] Implement JWT authentication.
- [x] Create authentication middleware.
- [x] Implement logout.
- [x] Implement protected routes.
- [x] Implement role-based access.
- [x] Validate user permissions.

## 5. Database

- [x] Connect MongoDB.
- [x] Configure Mongoose.
- [x] Create User model.
- [x] Create Product model.
- [x] Create Order model.
- [x] Create Payment model.
- [x] Create Campaign model.
- [x] Create AuditLog model.
- [x] Add schema validation.
- [x] Add required indexes.
- [x] Test database operations.

## 6. Product Catalog

- [x] Create product CRUD operations.
- [x] Store product name.
- [x] Store description.
- [x] Store category.
- [x] Store price.
- [x] Store inventory.
- [x] Store features.
- [x] Store related products.
- [x] Store product status.
- [x] Create product search.
- [x] Create product filtering.
- [x] Create product sorting.
- [x] Prevent invalid product data.

## 7. AI Product Discovery

- [x] Create natural-language product search.
- [x] Extract product requirements.
- [x] Extract price limits.
- [x] Extract category.
- [x] Extract features.
- [x] Check product availability.
- [x] Rank relevant products.
- [x] Return suitable recommendations.
- [x] Prevent hallucinated products.
- [x] Use catalog as the source of truth.

## 8. AI Recommendations

- [x] Create recommendation logic.
- [x] Explain important recommendations.
- [x] Respect customer requirements.
- [x] Respect price limits.
- [x] Respect inventory.
- [x] Prevent irrelevant recommendations.
- [x] Test recommendation accuracy.

## 9. Upselling

- [x] Identify higher-value products.
- [x] Compare product benefits.
- [x] Check availability.
- [x] Show price difference.
- [x] Explain additional value.
- [x] Ask customer before adding product.
- [x] Prevent aggressive upselling.

## 10. Cross-Selling

- [x] Identify related products.
- [x] Check product relationships.
- [x] Check availability.
- [x] Recommend complementary products.
- [x] Ask customer before adding products.
- [x] Prevent irrelevant cross-selling.

## 11. Merchant Growth

- [x] Analyze product sales.
- [x] Analyze inventory.
- [x] Analyze customer interest.
- [x] Analyze categories.
- [x] Identify growth opportunities.
- [x] Identify products to promote.
- [x] Identify upsell opportunities.
- [x] Identify cross-sell opportunities.
- [x] Provide merchant recommendations.
- [x] Explain growth recommendations.

## 12. Campaigns

- [x] Create campaign model.
- [x] Create campaign recommendation logic.
- [x] Create campaign creation API.
- [x] Validate campaign parameters.
- [x] Check merchant permissions.
- [x] Require merchant approval.
- [x] Execute approved campaign.
- [x] Verify campaign execution.
- [x] Record campaign action in audit log.

## 13. Discounts

- [x] Configure maximum discount limit.
- [x] Validate requested discount.
- [x] Reject discounts above limit.
- [x] Suggest safe alternatives.
- [x] Require merchant approval.
- [x] Execute approved discount.
- [x] Verify discount execution.
- [x] Record discount action.

## 14. Cart and Orders

- [x] Create cart functionality.
- [x] Add products to cart.
- [x] Remove products from cart.
- [x] Update quantities.
- [x] Validate product availability.
- [x] Calculate product totals.
- [x] Calculate final order amount.
- [x] Create order.
- [x] Track order status.

## 15. Razorpay Integration

- [x] Configure Razorpay Test Mode.
- [x] Store Razorpay credentials securely.
- [x] Keep secret key on backend.
- [x] Create Razorpay order API.
- [x] Connect checkout.
- [x] Handle payment response.
- [x] Verify payment on backend.
- [x] Update payment status.
- [x] Update order status.
- [x] Handle failed payments.
- [x] Handle cancelled payments.

## 16. Payment Safety

- [x] Require customer confirmation.
- [x] Display final amount before payment.
- [x] Validate amount on backend.
- [x] Verify Razorpay payment.
- [x] Never trust frontend payment status.
- [x] Never mark unpaid orders as paid.
- [x] Prevent duplicate payment operations.
- [x] Verify uncertain transactions.
- [x] Handle payment timeout safely.

## 17. Permissions and Safety

- [x] Implement role-based permissions.
- [x] Validate permissions on backend.
- [x] Enforce financial limits.
- [x] Enforce discount limits.
- [x] Enforce product limits.
- [x] Require approval for configured actions.
- [x] Prevent unauthorized actions.
- [x] Prevent AI from bypassing backend rules.

## 18. AI Agent

- [x] Create agent interface.
- [x] Implement intent detection.
- [x] Implement customer intents.
- [x] Implement merchant intents.
- [x] Implement conversation context.
- [x] Implement product discovery.
- [x] Implement recommendations.
- [x] Implement upselling.
- [x] Implement cross-selling.
- [x] Implement merchant growth suggestions.
- [x] Implement action classification.
- [x] Connect agent to backend tools.

## 19. Multilingual Support

- [x] Detect supported language input.
- [x] Support selected application language.
- [x] Support Romanized Indian languages.
- [x] Support mixed-language input.
- [x] Support phonetic input.
- [x] Return responses in selected language.
- [x] Test multilingual queries.

## 20. Agentic Commerce Flow

- [x] Understand customer intent.
- [x] Discover products.
- [x] Recommend products.
- [x] Explain recommendation.
- [x] Request confirmation.
- [x] Validate action.
- [x] Execute action.
- [x] Verify result.
- [x] Record important action.

## 21. Audit Trail

- [x] Create audit log model.
- [x] Record important AI actions.
- [x] Record merchant approvals.
- [x] Record customer confirmations.
- [x] Record payment actions.
- [x] Record campaign actions.
- [x] Record discount actions.
- [x] Record transaction references.
- [x] Record status.
- [x] Record timestamp.
- [x] Provide audit history to authorized users.

## 22. Error Handling

- [x] Handle API errors.
- [x] Handle database errors.
- [x] Handle authentication errors.
- [x] Handle authorization errors.
- [x] Handle inventory errors.
- [x] Handle payment errors.
- [x] Handle campaign errors.
- [x] Handle AI service errors.
- [x] Handle network failures.
- [x] Handle verification failures.
- [x] Display safe error messages.
- [x] Prevent sensitive error information from reaching users.

## 23. Duplicate Operation Protection

- [x] Detect uncertain operations.
- [x] Check existing transaction state.
- [x] Verify existing payment before retry.
- [x] Prevent duplicate orders.
- [x] Prevent duplicate payments.
- [x] Prevent duplicate campaigns.
- [x] Preserve transaction state.

## 24. Security

- [x] Protect API keys.
- [x] Protect Razorpay secret key.
- [x] Protect JWT secrets.
- [x] Protect database credentials.
- [x] Protect authentication tokens.
- [x] Validate backend requests.
- [x] Enforce backend authorization.
- [x] Protect sensitive data.
- [x] Never expose internal prompts.
- [x] Never expose private credentials.

## 25. Testing

- [x] Test authentication.
- [x] Test authorization.
- [x] Test product APIs.
- [x] Test inventory validation.
- [x] Test recommendations.
- [x] Test upselling.
- [x] Test cross-selling.
- [x] Test campaign approval.
- [x] Test discount limits.
- [x] Test order creation.
- [x] Test payment creation.
- [x] Test payment failure.
- [x] Test duplicate payment prevention.
- [x] Test audit logging.
- [x] Test AI failure handling.
- [x] Test multilingual input.

## 26. Safety Testing

- [x] Test hallucinated product prevention.
- [x] Test unavailable product handling.
- [x] Test unauthorized actions.
- [x] Test discount limit enforcement.
- [x] Test missing confirmation.
- [x] Test failed payment handling.
- [x] Test uncertain payment state.
- [x] Test duplicate operation prevention.
- [x] Test secret-key protection.
- [x] Test backend validation.

## 27. UI Testing

- [x] Test customer flow.
- [x] Test merchant flow.
- [x] Test AI chat.
- [x] Test product discovery.
- [x] Test product comparison.
- [x] Test cart.
- [x] Test checkout.
- [x] Test payment status.
- [x] Test campaign approval.
- [x] Test error states.
- [x] Test loading states.
- [x] Test responsive layout.

## 28. Integration Testing

- [x] Test frontend-to-backend communication.
- [x] Test backend-to-database communication.
- [x] Test backend-to-Razorpay communication.
- [x] Test AI-to-backend tools.
- [x] Test payment verification.
- [x] Test order status updates.
- [x] Test audit logging.
- [x] Test complete commerce flow.

## 29. Performance

- [ ] Optimize API response time.
- [ ] Optimize database queries.
- [x] Add required database indexes.
- [ ] Reduce unnecessary API calls.
- [x] Optimize product search.
- [x] Optimize AI requests.
- [ ] Prevent duplicate requests.
- [ ] Test application under normal load.

## 30. Deployment

- [ ] Configure production environment variables.
- [ ] Deploy frontend.
- [ ] Deploy backend.
- [ ] Configure MongoDB Atlas.
- [ ] Configure Razorpay Test Mode.
- [ ] Configure CORS.
- [ ] Configure production API URL.
- [ ] Test deployed application.
- [ ] Verify authentication.
- [ ] Verify payment flow.
- [ ] Verify audit trail.

## 31. Documentation

- [x] Complete PRD.md.
- [x] Complete Agent.md.
- [x] Complete API.md.
- [x] Complete Architecture.md.
- [x] Complete Database.md.
- [x] Complete ORD.md.
- [x] Complete TECH_STACK.md.
- [x] Complete ReleaseReadiness.md.
- [x] Complete Tasks.md.
- [x] Update README.md.

## 32. Final Verification

- [x] Frontend TypeScript passes.
- [x] Frontend ESLint passes.
- [x] Backend TypeScript passes.
- [x] Backend tests pass.
- [x] Authentication works.
- [x] Product discovery works.
- [x] AI recommendations work.
- [x] Upselling works.
- [x] Cross-selling works.
- [x] Merchant growth recommendations work.
- [x] Campaign approval works.
- [x] Discount limits work.
- [x] Checkout works.
- [x] Razorpay Test Mode payment works.
- [x] Payment verification works.
- [x] Failure handling works.
- [x] Duplicate operation protection works.
- [x] Audit trail works.
- [x] Multilingual input works.
- [x] Responsive UI works.

## 33. Final Demo Flow

- [ ] Login as merchant.
- [ ] Show merchant dashboard.
- [ ] Ask AI what should be promoted.
- [ ] Show growth recommendation.
- [ ] Show upsell/cross-sell opportunity.
- [ ] Switch to AI Buyer Mode.
- [ ] Search for a product using natural language.
- [ ] Demonstrate price filtering.
- [ ] Demonstrate inventory checking.
- [ ] Show recommendation.
- [ ] Demonstrate upselling.
- [ ] Demonstrate cross-selling.
- [ ] Add product to cart.
- [ ] Show final amount.
- [ ] Request customer confirmation.
- [ ] Create Razorpay Test Mode order.
- [ ] Complete test checkout.
- [ ] Verify payment.
- [ ] Show successful order.
- [ ] Show audit trail.
- [ ] Demonstrate one failure case.
- [ ] Demonstrate safe failure handling.

## 34. Completion Criteria

- [ ] All critical features implemented.
- [x] All financial actions are explainable.
- [x] All financial actions are bounded.
- [x] All required actions are gated.
- [x] Payment results are verified.
- [x] Important actions are auditable.
- [x] No secret keys are exposed.
- [x] No duplicate financial operations occur.
- [x] No unauthorized actions occur.
- [x] No unavailable products are presented as available.
- [x] AI does not override backend safety rules.
- [ ] Application is ready for Razorpay Track 01 demonstration.

```
```

````
# Steps 20–23 — Final Razorpay Track 01 Selection Readiness

## Objective

Complete the final high-value work required to make SellPilot AI strongly demonstrate Razorpay Track 01:

> AI Growth & Agentic Commerce — Grow the merchant's revenue, and make them sellable to AI buyers.

Implement ONLY the final Steps 20–23 together.

Do NOT add unnecessary features.

Do NOT create duplicate systems.

Do NOT add new dependencies unless absolutely required. Prefer existing dependencies and existing architecture.

---

# Step 20 — Judge Demo & Evidence Layer

Create a polished, evaluator-friendly demonstration flow using the existing SellPilot functionality.

The demo must clearly demonstrate BOTH sides of Track 01.

## A. AI Buyer Flow

Demonstrate:

User/AI Buyer
→ Product Discovery
→ AI Recommendation
→ Product Comparison
→ Cart
→ Server-side Checkout Calculation
→ Inventory Validation
→ Razorpay Test Mode Checkout
→ Server-side Payment Verification
→ Order Creation
→ Audit Trail

The AI must never control:

- Price
- Discount
- Inventory
- Order total
- Payment status
- Merchant identity
- Payment verification

All authoritative values must remain server-side.

## B. Merchant Growth Flow

Demonstrate:

Real Merchant Data
→ AI Growth Opportunity
→ Explanation
→ Campaign/Action Plan
→ Guardrail Validation
→ Merchant Approval
→ Server Revalidation
→ Controlled Execution
→ Result
→ Audit Trail

Show at least one realistic supported growth scenario.

Example:

High product interest
+
Low conversion
↓
AI identifies opportunity
↓
Explains supporting metrics
↓
Creates bounded promotion proposal
↓
Merchant approves
↓
Server validates
↓
Existing controlled execution runs
↓
Result is recorded
↓
Audit trail is created

Do NOT fabricate business results.

If no real performance improvement has occurred, show the action as executed successfully without claiming revenue increased.

---

# Step 21 — Final Security & Money-Safety Review

Review the entire existing implementation from Steps 1–19.

Do NOT redesign the architecture.

Fix only genuine security/reliability issues that could affect Track 01 evaluation.

Verify and enforce:

## Authentication

- Protected buyer endpoints require authentication.
- Protected merchant endpoints require authentication.
- Roles are correctly enforced.
- Customers cannot access merchant operations.
- Merchants cannot access another merchant's data.

## Ownership

Validate ownership for:

- Cart
- Orders
- Payments
- Products
- Campaigns
- Growth action plans
- Audit records
- Conversations

Prevent IDOR and cross-user access.

## Money Safety

The AI/client must never be able to directly set:

- Payment amount
- Order total
- Product price
- Discount amount
- Payment status
- Inventory quantity
- Merchant ID

Server-side calculations remain authoritative.

## Razorpay

Keep Razorpay strictly in TEST MODE.

Require:

`RAZORPAY_KEY_ID` beginning with:

`rzp_test_`

Never expose:

`RAZORPAY_KEY_SECRET`

Never accept client-provided payment verification as authoritative.

Payment verification must use the existing server-side HMAC implementation.

Do NOT modify the existing Razorpay architecture unless required to fix a real issue.

## Guardrails

Ensure every money-affecting merchant action passes through:

Authorization
→ Guardrails
→ Merchant Approval
→ Server Revalidation
→ Controlled Execution

AI must never bypass this chain.

## Idempotency

Verify duplicate protection for:

- Checkout
- Order creation
- Payment callbacks
- Growth action execution
- Campaign execution

Repeated requests must not create duplicate orders, duplicate payment effects, or duplicate campaign executions.

## Audit

Ensure important money and commerce events are auditable.

Do not log:

- Secrets
- Passwords
- JWT tokens
- Razorpay secrets
- Private credentials
- Private AI chain-of-thought

---

# Step 22 — Failure & Recovery Demonstration

Make the existing system clearly handle at least ONE important failure gracefully.

Use existing error-handling infrastructure.

Demonstrate a scenario such as:

### Payment Failure

Razorpay payment fails
↓
Order/payment state remains consistent
↓
Inventory is not incorrectly deducted
↓
User receives a clear error
↓
Audit event records the failure

OR:

### Inventory Failure

Product becomes unavailable
↓
Checkout validation detects it
↓
Checkout is rejected
↓
No payment/order side effect occurs
↓
User receives a clear explanation
↓
Audit trail records the relevant event

OR:

### Duplicate Request

Same checkout request sent twice
↓
Idempotency detects duplicate
↓
Existing order/result is reused
↓
No duplicate order/payment effect

Use whichever scenario is already best supported by the existing implementation.

Do NOT create a fake success.

Do NOT hide failures.

---

# Step 23 — Final Razorpay Track 01 Submission Readiness

Perform a final repository-wide review of the existing implementation.

The final application must clearly communicate this value proposition:

> SellPilot is an AI-native commerce system where AI can help buyers discover and purchase products while AI helps merchants identify and execute bounded revenue-growth opportunities — with authorization, guardrails, merchant approval, server-side validation, idempotency, and a complete audit trail.

## Final Architecture

Buyer side:

AI Buyer
→ Agent Tools
→ Catalog
→ Recommendation
→ Cart
→ Checkout
→ Razorpay Test Mode
→ Payment Verification
→ Order
→ Audit

Merchant side:

Merchant Data
→ AI Growth Agent
→ Opportunity
→ Campaign/Action Plan
→ Guardrails
→ Merchant Approval
→ Server Revalidation
→ Controlled Execution
→ Result
→ Audit

## Final Acceptance Criteria

All of the following must be true:

### AI Buyer

- [ ] Natural-language product discovery works.
- [ ] Real catalog data is used.
- [ ] AI recommendations use real products.
- [ ] Product comparison works.
- [ ] Cart operations work.
- [ ] Inventory is checked server-side.
- [ ] Checkout totals are calculated server-side.
- [ ] Order creation works.
- [ ] Razorpay Test Mode is used.
- [ ] Payment verification is server-side.
- [ ] Duplicate checkout requests are protected.
- [ ] Payment callbacks are idempotent.
- [ ] Buyer ownership is enforced.
- [ ] Failures are handled gracefully.

### Merchant Growth

- [ ] Real merchant data is analyzed.
- [ ] Revenue opportunities are detected.
- [ ] Opportunities are explainable.
- [ ] Supporting metrics are shown.
- [ ] Opportunities have priority.
- [ ] Inventory is considered.
- [ ] Upsell/cross-sell recommendations work where supported.
- [ ] Campaign plans are structured.
- [ ] Discount/promotion bounds are enforced.
- [ ] Merchant approval is mandatory.
- [ ] Server revalidation occurs before execution.
- [ ] Controlled execution uses the existing execution layer.
- [ ] Duplicate execution is prevented.
- [ ] Execution results are recorded.

### Safety

- [ ] AI cannot directly move money.
- [ ] AI cannot set authoritative prices.
- [ ] AI cannot bypass guardrails.
- [ ] AI cannot bypass merchant approval.
- [ ] Client cannot control payment status.
- [ ] Client cannot control order totals.
- [ ] Client cannot control inventory.
- [ ] Authorization is enforced server-side.
- [ ] Ownership is validated.
- [ ] Razorpay remains Test Mode only.
- [ ] Secrets are never exposed.
- [ ] Audit trail is preserved.

### Explainability

Every important AI-driven action must allow the evaluator to understand:

1. What the AI detected.
2. Why it detected it.
3. What data supported it.
4. What action was recommended.
5. What limits were applied.
6. Whether merchant approval was required.
7. Whether server validation passed.
8. What actually happened.
9. Whether the action succeeded or failed.

Never expose private chain-of-thought.

Use concise operational explanations instead.

### Demo Readiness

The application should allow an evaluator to understand the core value within approximately 3–5 minutes.

The UI should make these two capabilities obvious:

**AI BUYER**

> "Find me a product, recommend one, add it to my cart, and complete a Test Mode checkout."

**AI MERCHANT**

> "Analyze my store and tell me how I can increase revenue."

Then demonstrate:

Opportunity
→ Explanation
→ Action
→ Approval
→ Guardrail
→ Execution
→ Audit

Avoid unrelated UI redesign.

Improve only existing UI elements necessary to make the core Track 01 flow understandable.

---

# Technical Constraints

1. Inspect Steps 1–19 before modifying anything.
2. Reuse existing services and dependencies.
3. Do not create duplicate payment systems.
4. Do not create duplicate cart systems.
5. Do not create duplicate order systems.
6. Do not create duplicate audit systems.
7. Do not create duplicate guardrail systems.
8. Do not create duplicate campaign execution systems.
9. Do not install unnecessary dependencies.
10. Do not modify Razorpay into a fake payment system.
11. Razorpay must remain TEST MODE only.
12. Do not implement unrelated features.
13. Do not implement additional future steps.
14. Do not fabricate metrics, customers, revenue, orders, or campaign results.
15. Preserve existing functionality.

---

# Validation

After implementation, run the existing validation commands.

At minimum:

- Backend typecheck
- Frontend typecheck
- Backend tests
- Frontend lint
- Backend build
- Frontend production build
- `git diff --check`
- Editor/compiler diagnostics
- Scan for accidental live Razorpay credentials
- Scan for fake/simulated payment paths
- Verify no new unnecessary dependencies were added

Fix genuine errors found during validation.

Do not rewrite passing tests merely to make them pass.

---

# Final Report

At the end provide a concise report containing:

1. Files changed
2. Features completed
3. Security fixes
4. Demo flow
5. Failure scenario demonstrated
6. Test results
7. Build results
8. Dependencies added, if any
9. Any remaining environment-only requirements

Do NOT implement anything beyond Steps 20–23.
One important thing

I deliberately combined these four because they are not four huge new feature sets. They are the final layer around what you've already built:

Step 20: make the value obvious
Step 21: make the money flow safe
Step 22: prove it survives failure
Step 23: make the whole thing submission-ready

That's much better use of your remaining Manus credits than asking it to build four separate systems.