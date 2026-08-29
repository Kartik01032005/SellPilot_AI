# SellPilot AI — Product Requirements Document (PRD)

## 1. Product Overview

### Product Name
SellPilot AI

### Track
Razorpay Buildathon — Track 01: AI Growth & Agentic Commerce

### Tagline
AI Growth Agent for Smarter Merchant Commerce

### Product Type
AI-powered merchant growth and agentic commerce platform.

### Vision

SellPilot AI helps merchants increase revenue by using AI to understand their products, identify sales opportunities, recommend actions, and assist customers through the buying journey.

The platform goes beyond being a chatbot. It acts as a controlled AI agent that can understand, recommend, and execute approved commerce actions.

---

## 2. Problem Statement

Merchants often have product and sales data but do not have enough time or tools to convert that data into useful actions.

Common problems include:

- Difficulty identifying which products should be promoted.
- Missed upselling opportunities.
- Missed cross-selling opportunities.
- Manual campaign creation.
- Difficulty understanding customer buying intent.
- Customers struggling to discover suitable products.
- Traditional dashboards provide data but do not actively help merchants take action.
- AI agents need a structured way to understand products and safely interact with commerce systems.

The result is missed revenue opportunities and a less personalized shopping experience.

---

## 3. Proposed Solution

SellPilot AI acts as an AI growth agent between the merchant, their catalog, and customers.

The system analyzes available merchant information and identifies opportunities such as:

- Products that should be promoted.
- Products suitable for upselling.
- Products suitable for cross-selling.
- Potential marketing campaigns.
- Potential discounts.
- Products relevant to a customer's request.

The AI explains its recommendation before performing important actions.

Financial actions are:

- Explainable
- Bounded
- Gated

The merchant remains in control of important financial decisions.

---

## 4. Target Users

### Primary User — Merchant

A merchant who wants to:

- Increase revenue.
- Understand product opportunities.
- Improve average order value.
- Create better campaigns.
- Use AI to assist customers.
- Automate repetitive commerce tasks safely.

### Secondary User — Customer / AI Buyer

A customer who wants to:

- Find products using natural language.
- Receive personalized recommendations.
- Discover related products.
- Complete a purchase through an AI-assisted experience.

---

## 5. Product Goals

The primary goals of SellPilot AI are:

1. Help merchants identify revenue opportunities.
2. Reduce manual work involved in product promotion.
3. Increase upselling and cross-selling opportunities.
4. Allow customers to discover products conversationally.
5. Make merchant catalogs understandable to AI buyers.
6. Enable an AI-assisted commerce flow.
7. Integrate Razorpay for test-mode transactions.
8. Ensure financial actions are safe and controlled.
9. Provide a complete audit trail for important actions.
10. Demonstrate graceful handling of failures.

---

## 6. Core Product Features

### 6.1 AI Merchant Assistant

The merchant can communicate with SellPilot AI using natural language.

Example:

Merchant:
"Which product should I promote?"

SellPilot:
"Your Running Shoes have strong demand. I recommend promoting them with Sports Socks as a cross-sell."

The AI should provide short, useful, actionable responses.

---

### 6.2 Product Catalog Understanding

SellPilot understands the merchant's catalog.

Each product may contain:

- Product name
- Description
- Category
- Price
- Inventory
- Features
- Related products
- Sales information

The catalog should also be structured so that AI buyers can understand it.

---

### 6.3 AI Product Recommendations

SellPilot can recommend products based on available merchant and customer information.

Example:

Customer:
"I need running shoes under ₹3000."

AI:
"I found two options under ₹3000. The Pro Running Shoes at ₹2999 have better cushioning."

---

### 6.4 Upselling

The AI identifies opportunities to recommend a higher-value product.

Example:

Customer:
"I want running shoes."

AI:
"Our Pro Running Shoes cost ₹500 more and offer better cushioning. Would you like to see them?"

The customer must confirm before purchasing.

---

### 6.5 Cross-Selling

The AI recommends complementary products.

Examples:

- Running Shoes → Sports Socks
- Laptop → Laptop Bag
- Camera → Memory Card
- Phone → Case

The goal is to increase average order value while keeping recommendations relevant.

---

### 6.6 Campaign Recommendations

SellPilot can identify opportunities for merchant campaigns.

Example:

"Sports category sales have decreased recently. I recommend a campaign for your top three sports products."

The AI should explain why the campaign is recommended.

---

### 6.7 Discount Recommendations

SellPilot may recommend a discount when appropriate.

Example:

"Your product has received many views but fewer purchases. A 10% promotional discount could be tested."

Discounts must have predefined limits.

The AI cannot create unlimited or unrestricted discounts.

---

### 6.8 Merchant Approval

Important actions require merchant approval.

Example:

```text
AI Recommendation
        ↓
Explain Reason
        ↓
Merchant Approval
        ↓
Validate Limits
        ↓
Execute Action
        ↓
Verify Result
        ↓
Create Audit Log