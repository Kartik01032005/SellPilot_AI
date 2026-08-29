# SellPilot AI — Database Specification

## 1. Database

- Database: MongoDB Atlas
- ODM: Mongoose
- Backend: Node.js + Express.js + TypeScript
- Database is the source of truth for commerce data.
- No unnecessary database technologies.

## 2. Collections

- `users` — User accounts, roles and authentication data.
- `merchants` — Merchant details, limits and settings.
- `products` — Product catalog, prices, stock and features.
- `orders` — Customer orders and order status.
- `payments` — Razorpay Test Mode payment records.
- `campaigns` — Merchant campaigns and discounts.
- `recommendations` — AI recommendations and growth opportunities.
- `conversations` — AI conversation context.
- `auditLogs` — Important commerce and financial actions.

## 3. Users

Fields:
- `_id`
- `name`
- `email`
- `password`
- `role`
- `merchantId`
- `createdAt`
- `updatedAt`

Roles:
- `customer`
- `merchant`
- `admin`

Passwords must be hashed using bcrypt.

## 4. Merchants

Fields:
- `_id`
- `name`
- `email`
- `businessName`
- `currency`
- `maxDiscountPercentage`
- `maxTransactionAmount`
- `approvalRequired`
- `createdAt`
- `updatedAt`

Merchant limits must always be enforced by the backend.

## 5. Products

Fields:
- `_id`
- `merchantId`
- `name`
- `description`
- `category`
- `price`
- `currency`
- `stock`
- `sku`
- `features`
- `tags`
- `relatedProducts`
- `isActive`
- `createdAt`
- `updatedAt`

Rules:
- AI uses product data from the database.
- Never invent product information.
- Never recommend unavailable products as available.
- `stock > 0` means available.

## 6. Orders

Fields:
- `_id`
- `userId`
- `merchantId`
- `items`
- `totalAmount`
- `currency`
- `status`
- `paymentId`
- `razorpayOrderId`
- `createdAt`
- `updatedAt`

Order statuses:
- `pending`
- `payment_pending`
- `paid`
- `failed`
- `cancelled`
- `completed`

## 7. Payments

Fields:
- `_id`
- `orderId`
- `userId`
- `merchantId`
- `razorpayOrderId`
- `razorpayPaymentId`
- `amount`
- `currency`
- `status`
- `verificationStatus`
- `createdAt`
- `updatedAt`

Rules:
- Razorpay Test Mode only.
- Payment must be verified by the backend.
- Never trust frontend payment status.
- Never mark an unpaid order as paid.
- Prevent duplicate payments.
- Store no Razorpay secret keys in the database.

## 8. Campaigns

Fields:
- `_id`
- `merchantId`
- `name`
- `description`
- `productIds`
- `discountPercentage`
- `status`
- `createdBy`
- `approvedBy`
- `approvedAt`
- `createdAt`
- `updatedAt`

Statuses:
- `draft`
- `recommended`
- `pending_approval`
- `approved`
- `active`
- `paused`
- `completed`
- `rejected`

AI campaign actions require merchant approval when configured.

## 9. Recommendations

Fields:
- `_id`
- `merchantId`
- `userId`
- `type`
- `productId`
- `recommendedProductIds`
- `reason`
- `confidence`
- `status`
- `createdAt`

Types:
- `upsell`
- `cross_sell`
- `promotion`
- `campaign`
- `product`
- `growth`

Recommendations must be based on real database data.

## 10. Conversations

Fields:
- `_id`
- `userId`
- `merchantId`
- `messages`
- `language`
- `createdAt`
- `updatedAt`

Messages contain:
- `role`
- `content`
- `timestamp`

Conversation data must not contain secrets or private credentials.

## 11. Audit Logs

Fields:
- `_id`
- `userId`
- `merchantId`
- `action`
- `entityType`
- `entityId`
- `status`
- `amount`
- `metadata`
- `timestamp`

Important actions to record:
- Product recommendations
- Upsells
- Cross-sells
- Campaign actions
- Discount actions
- Order creation
- Checkout
- Payment creation
- Payment verification
- Payment failure

## 12. Relationships

- `users.merchantId → merchants._id`
- `products.merchantId → merchants._id`
- `orders.userId → users._id`
- `orders.merchantId → merchants._id`
- `orders.items.productId → products._id`
- `payments.orderId → orders._id`
- `campaigns.merchantId → merchants._id`
- `campaigns.productIds → products._id`
- `recommendations.merchantId → merchants._id`
- `conversations.userId → users._id`
- `auditLogs.userId → users._id`

## 13. Commerce Flow

Product Discovery:
`User → AI → Products → Inventory → Recommendation`

Purchase:
`Product → Order → Razorpay Test Mode → Backend Verification → Order Update → Audit Log`

Merchant Growth:
`Merchant → AI → Sales/Product Data → Recommendation → Approval → Action → Verification → Audit Log`

## 14. Indexes

Recommended indexes:
- `users.email`
- `products.merchantId`
- `products.category`
- `products.sku`
- `orders.userId`
- `orders.merchantId`
- `orders.razorpayOrderId`
- `payments.razorpayOrderId`
- `payments.razorpayPaymentId`
- `campaigns.merchantId`
- `recommendations.merchantId`
- `auditLogs.timestamp`

## 15. Validation

Backend must validate:
- Required fields
- Email
- User roles
- Product price
- Product stock
- Discount limits
- Transaction amount
- Ownership
- Permissions
- Payment status

Invalid data must be rejected.

## 16. Inventory Rules

- Check stock before purchase.
- Never allow negative stock.
- Validate quantity.
- Prevent duplicate inventory updates.
- Re-check inventory before final purchase.

## 17. Financial Safety

- Never mark unpaid transactions as paid.
- Verify important financial operations.
- Prevent duplicate financial operations.
- Verify uncertain transaction states before retrying.
- Record financial actions in `auditLogs`.
- Backend is the final authority.

## 18. Security

- Database credentials use environment variables.
- MongoDB connection string stays on the server.
- Razorpay secret key stays on the server.
- JWT secrets stay on the server.
- Never expose credentials to the frontend.
- Validate all incoming data.
- Protect user and merchant information.

## 19. Database Error Handling

Handle:
- Connection failures
- Query failures
- Validation errors
- Duplicate records
- Missing documents
- Unauthorized access
- Timeouts
- Transaction conflicts

Do not expose internal database errors to users.

## 20. Source of Truth

MongoDB is the source of truth for:

- Products
- Prices
- Inventory
- Users
- Permissions
- Merchant limits
- Orders
- Payments
- Campaigns
- Recommendations
- Audit records

AI responses must never override database values.

## 21. Core Principle

`Reliable Data + Safe Commerce + Verified Payments + Merchant Growth + Auditability`