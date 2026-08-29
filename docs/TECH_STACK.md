# SellPilot AI — Technology Stack

## 1. Project

- Project: SellPilot AI
- Razorpay Track: Track 01 — AI Growth & Agentic Commerce
- Purpose: AI-powered merchant growth and agentic commerce platform.

## 2. Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Responsive UI
- AI chat interface
- Merchant dashboard
- AI Buyer interface
- Product catalog
- Product recommendations
- Cart
- Checkout
- Payment status
- Campaign approval

## 3. Backend

- Node.js
- Express.js
- TypeScript
- REST APIs
- Business logic
- Authentication
- Authorization
- Validation
- Payment processing
- Payment verification
- Audit logging

## 4. Database

- MongoDB
- Mongoose

Main data:

- Users
- Products
- Orders
- Payments
- Campaigns
- Audit Logs

## 5. Authentication

- JWT
- Backend authentication middleware
- Role-based authorization
- Protected API routes

Roles:

- Merchant
- Customer

## 6. AI Agent

SellPilot AI handles:

- Intent detection
- Natural-language understanding
- Product discovery
- Product recommendations
- Product comparison
- Upselling
- Cross-selling
- Merchant growth suggestions
- Campaign recommendations
- Discount recommendations
- Conversation context
- Multilingual input
- Romanized language input
- Mixed-language input

The AI does not control critical financial validation.

## 7. Agentic Commerce

The system supports:

- AI product discovery
- AI recommendations
- AI buyer interaction
- Conversational shopping
- Upselling
- Cross-selling
- Checkout assistance
- Payment confirmation
- Transaction verification
- Audit trail

Flow:

User Request
↓
Intent Understanding
↓
Product / Data Retrieval
↓
Recommendation
↓
Permission / Confirmation
↓
Backend Validation
↓
Execution
↓
Verification
↓
Audit

## 8. Merchant Growth

The system uses available merchant data to support:

- Product promotion
- Revenue opportunities
- Upselling
- Cross-selling
- Campaign recommendations
- Discount recommendations
- Product performance analysis
- Inventory analysis

## 9. Product Catalog

Product fields may include:

- Product ID
- Name
- Description
- Category
- Price
- Inventory
- Features
- Related Products
- Sales Information
- Product Status

The catalog is the source of truth for product information.

## 10. Payments

- Razorpay Test Mode
- Razorpay Checkout
- Backend order creation
- Backend payment verification
- Payment status tracking

Payment flow:

Product Selection
↓
Price Confirmation
↓
Customer Confirmation
↓
Razorpay Test Order
↓
Razorpay Checkout
↓
Payment
↓
Backend Verification
↓
Order Confirmation
↓
Audit Log

## 11. Payment Security

- Razorpay secret keys remain on the backend.
- Secret keys are never exposed to the frontend.
- Payment results are verified on the backend.
- Frontend payment status is not treated as final proof.
- Unpaid orders are never marked as paid.
- Duplicate financial operations are prevented.

## 12. Safety Controls

Important financial actions are:

- Explainable
- Bounded
- Gated
- Verified
- Auditable

Controls include:

- Merchant approval
- Customer confirmation
- Discount limits
- Transaction limits
- Permission checks
- Inventory checks
- Payment verification
- Duplicate-operation protection

## 13. Audit Trail

Important actions are recorded with information such as:

- Action
- Actor
- Role
- Target
- Approval
- Status
- Reason
- Timestamp
- Transaction reference

## 14. Multilingual Support

The system supports:

- English
- Supported Indian languages
- Romanized Indian languages
- Mixed-language input
- Phonetic regional-language input

Examples:

- "mujhe shoes chahiye"
- "nanage running shoes beku"
- "enakku shoe venum"
- "naaku shoes kavali"

## 15. External Services

- Razorpay Test Mode — payments
- MongoDB Atlas — database
- AI service / API — AI capabilities
- Other APIs only when required by the application

## 16. Development Tools

- Visual Studio Code / Antigravity IDE
- Git
- GitHub
- npm
- TypeScript
- ESLint

## 17. Version Control

- Git
- GitHub
- Feature branches
- Pull requests when required

Example branch:

- feature/agentic-commerce

## 18. Environment Configuration

Environment variables are used for:

- Database connection
- JWT secret
- Razorpay key ID
- Razorpay key secret
- AI API credentials
- Other private configuration

Secrets must be stored in environment variables and never hardcoded.

## 19. Deployment

Preferred deployment:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Payment: Razorpay Test Mode

## 20. Testing

Testing should cover:

- Frontend TypeScript compilation
- ESLint
- Backend TypeScript compilation
- API testing
- Authentication
- Authorization
- Product discovery
- Inventory validation
- Payment verification
- Discount limits
- Campaign approval
- AI failure handling
- Duplicate transaction prevention
- Audit logging

## 21. Error Handling

The system should safely handle:

- API failures
- Network failures
- Database failures
- AI failures
- Payment failures
- Authentication failures
- Authorization failures
- Inventory failures
- Verification failures

The system must never claim success when an operation fails.

## 22. Free / Prototype-Friendly Technologies

Preferred technologies should be:

- Free
- Open-source where possible
- Free-tier compatible
- Suitable for a hackathon prototype
- Easy to develop and deploy

The project should avoid unnecessary paid services.

## 23. Technology Principles

- Security first
- Backend validation
- Least privilege
- Explicit confirmation
- Deterministic financial logic
- Explainable AI recommendations
- Inventory awareness
- Payment verification
- Duplicate-operation prevention
- Auditability
- Modular architecture
- Minimal dependencies

## 24. Final Technology Stack

Frontend:
Next.js + React + TypeScript + Tailwind CSS

Backend:
Node.js + Express.js + TypeScript

Database:
MongoDB + Mongoose

Authentication:
JWT

AI:
SellPilot AI Agent + AI API

Payments:
Razorpay Test Mode

Version Control:
Git + GitHub

Deployment:
Vercel + Render + MongoDB Atlas

Testing:
TypeScript + ESLint + Backend Test Suite

Core Principle:
Use AI for understanding and recommendations, while the backend remains the final authority for authorization, validation, payments, transaction state, security, and verification.