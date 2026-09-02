# SellPilot AI

SellPilot is an AI-powered merchant growth and agentic commerce demo for Razorpay Track 01. It helps merchants find catalog-backed revenue opportunities and lets an AI buyer discover products, build a cart and complete a verified Razorpay Test Mode transaction.

## Track 01 flow

**AI Growth:** merchant data -> explainable opportunity -> bounded action plan -> merchant approval -> controlled execution -> verification -> audit trail.

**Agentic Commerce:** AI intent -> real catalog recommendation -> customer confirmation -> cart -> server price and inventory validation -> Razorpay Test Mode -> server HMAC verification -> demo order -> audit trail.

The AI recommends and explains. The backend is authoritative for permissions, merchant approval, discounts, prices, inventory, payment status and order state. Important actions are authenticated, idempotent and audited.

## Demo and setup

See [docs/ReleaseReadiness.md](docs/ReleaseReadiness.md) for the evaluator walkthrough, failure checks and environment details.

```powershell
npm install
Copy-Item .env.example server/.env
npm run dev
```

Set `MONGO_URI`, a strong `JWT_SECRET`, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env`. `RAZORPAY_KEY_ID` must be a Razorpay **Test Mode** key beginning with `rzp_test_`. The secret is never sent to the browser. The checkout is explicitly labelled **Razorpay Test Mode · Demo Payment** and has no live-payment path.

Useful commands:

```powershell
npm run typecheck
npm test
npm run build:server
npm run build:client
```

Never commit `.env` files, credentials, tokens or payment secrets.