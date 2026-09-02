# SellPilot AI — Razorpay Track 01 Demo Readiness

## What to demonstrate

SellPilot addresses two connected problems: merchants miss actionable revenue opportunities in their catalog, and buyers need help moving from intent to a trustworthy purchase. Track 01 is demonstrated through:

1. **AI Growth:** the merchant assistant analyzes catalog, sales, inventory and demand signals, explains an opportunity, and proposes a bounded campaign or discount. Merchant approval is required before execution; backend permissions and discount limits remain authoritative.
2. **Agentic Commerce:** the AI buyer searches the real catalog, recommends available products, asks for confirmation, builds a cart, and sends the server-calculated total to Razorpay Test Mode.

## Payment safety

The checkout uses only Razorpay Test Mode. The backend requires `RAZORPAY_KEY_ID` to start with `rzp_test_` and requires a matching server-side secret. It creates the Razorpay order and returns only the public test key, order ID, amount and currency. The frontend cannot set the total, mark an order paid, or verify a payment.

The Razorpay Checkout callback supplies the payment ID and signature to the backend. Existing server-side HMAC verification, payment state transitions, atomic inventory checks, idempotency protection and audit logging determine success. A failed, cancelled, invalid, duplicate or uncertain payment never becomes a paid order. The UI labels the flow **Razorpay Test Mode** and **Demo Payment**.

## Agent-to-agent transaction trace

The buyer-agent request receives a server-issued `spc_...` correlation ID. That ID is carried through intent detection, agent tools, cart checkout, order creation, Razorpay order creation, HMAC verification, and the verified order audit events. Merchant users can inspect actor type, event, status, timestamp and correlation ID in the existing **AI-Assisted Commerce Audit Ledger**. `GET /api/orders/:id/timeline` returns the same recorded events after the existing order ownership check. This is observability only: agents cannot move money directly or set payment/order state.

## Demo setup

1. Install dependencies with `npm install` at the repository root.
2. Copy `.env.example` to `server/.env` and set a MongoDB URI, a strong JWT secret, and Razorpay **Test Mode** credentials. Never put the Razorpay secret in `client/.env`.
3. Start MongoDB and run `npm run dev`.
4. Open `http://localhost:3000`, sign in with the demo customer or merchant controls, and use the visible AI buyer, cart, checkout, merchant growth, campaigns, orders and audit views.
5. In Razorpay’s Test Mode checkout, use a Razorpay test payment method. A successful order is visible only after backend signature verification.

## Three-to-five-minute judge path

1. Sign in as a merchant and open **Growth Insights**. Ask the merchant assistant what to promote; show the catalog-backed reason, discount limit, campaign approval gate, and resulting audit event.
2. Switch to the buyer assistant and search for running shoes under a budget. Show the verified recommendation, inventory result, and **Add to Cart** action.
3. Open the cart and confirm the server-verified total. Proceed through **Razorpay Test Mode · Demo Payment** using a test payment method, then show the verified order and its trace ID.
4. Open the merchant **AI-Assisted Commerce Audit Ledger** and point out the buyer-agent actor, payment/order events, status, and shared correlation ID. For recovery, cancel the payment or retry with a changed/out-of-stock item and show the recorded failure without a paid order.

## Failure checks

Try an out-of-stock item, change a catalog price before checkout, cancel the Razorpay modal, submit an invalid signature, retry a payment request, attempt an unauthorized merchant action, and request a discount above the merchant limit. These paths are expected to reject safely, preserve server authority, and record relevant audit events.

## Environment variables

Required for a working demo: `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID` (must be `rzp_test_...`), `RAZORPAY_KEY_SECRET`, `CLIENT_URL`, and `NEXT_PUBLIC_API_URL`. Optional AI variables are `AI_SERVICE_URL` and `AI_API_KEY`. Secrets and tokens are server-side only and are excluded by `.gitignore`.

There is no live-payment configuration or fallback payment simulator in this project. Without valid Test Mode credentials, payment order creation fails closed with `PAYMENT_UNAVAILABLE`.
