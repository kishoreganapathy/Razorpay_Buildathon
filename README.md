# NegotiatePay

Razorpay Buildathon Track 01 — **AI Growth & Agentic Commerce**.

Customer AI and merchant AI negotiate a price. A **deterministic policy engine** owns every rupee. Gemini only understands language and explains decisions. Razorpay test mode settles payment after **explicit customer approval**.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 14 (App Router) |
| Language | JavaScript |
| Database | MySQL + Prisma |
| LLM | Gemini 2.0 Flash (NLU + copy only) |
| Payments | Razorpay Node SDK (test mode) |
| Auth | JWT in an HTTP-only cookie |
| UI | Tailwind CSS |

## Architecture

```
Customer → Chat UI → Customer AI (Gemini NLU)
        → Product search (SQL, not the LLM)
        → NegotiationEngine + PolicyEngine (deterministic)
        → Merchant AI (Gemini copy from engine output)
        → Explicit approval
        → PaymentGate re-validates amount, inventory, expiry
        → Razorpay test order → verify signature → inventory decrement
        → Audit trail
```

The LLM **cannot** set the payment amount or skip policy checks.

## Negotiation formula

**LINEAR (default):**

```
step = (sellingPrice - minimumPrice) / maxRounds
counter = round_to_₹50(sellingPrice - round * step)
counter = clamp(counter, minimumPrice, sellingPrice)
```

**SCHEDULE (seeded 55" TV — matches the pitch demo):**

```
round 1 counter = ₹47,000
round 2 counter = ₹45,500
round 3 floor   = ₹44,000
ACCEPT if customer offer ≥ minimumPrice and all other policy rules pass
```

Demo path:

1. Customer: 55-inch 4K TV under ₹45,000  
2. Offer ₹40,000 → policy BELOW_MINIMUM → counter ₹47,000  
3. Offer ₹42,000 → counter ₹45,500  
4. Offer ₹44,500 → ACCEPT  
5. Customer clicks **Approve & Pay**  
6. Backend re-checks policy + inventory, then creates a Razorpay order for **₹44,500 only**

## Graceful failure (required)

**Inventory miss:** Merchant dashboard → **set stock 0** after a deal is agreed, then pay. Payment is **not** created. Session is `FAILED`, audit event `INVENTORY_CHECK_FAIL`.

**Payment fail:** Use Razorpay test card that fails (or dismiss checkout). Session stays `PAYMENT_PENDING`. No inventory decrement. Customer can retry. Audit records `PAYMENT_FAILURE`.

Success cards (test mode): `4111 1111 1111 1111`  
Failure: use a [failed payment test card](https://razorpay.com/docs/payments/payments/test-card-upi-details/) or cancel the modal.

## Local setup

1. Copy env and fill keys:

```bash
copy .env.example .env
```

2. Start MySQL:

```bash
docker compose up -d
```

Or point `DATABASE_URL` at any MySQL 8 instance:

```
mysql://USER:PASSWORD@HOST:3306/negotiatepay
```

3. Gemini: create a key at [Google AI Studio](https://aistudio.google.com/apikey).  
   If `GEMINI_API_KEY` is empty, a regex fallback still extracts intent so the demo can run.

4. Razorpay Dashboard → **Test mode** → API Keys. Put `rzp_test_...` in `.env`.

5. Migrate, seed, run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open http://localhost:3000

| Account | Email | Password |
| --- | --- | --- |
| Customer | customer@demo.com | customer123 |
| Merchant | merchant@demo.com | merchant123 |

## Scripts

```bash
npm run dev
npm run build
npx prisma studio
node scripts/test-negotiation.mjs
```

## Webhooks (optional)

```bash
npx ngrok http 3000
```

Razorpay Dashboard → Webhooks → `https://YOUR-NGROK/api/payment/webhook`  
Events: `payment.failed`, `payment.captured`.

## Deploy

Vercel + a hosted MySQL (PlanetScale, RDS, Railway). Set all `.env` variables. Run `prisma migrate deploy` in the build command:

```
npx prisma generate && npx prisma migrate deploy && next build
```

## What judges should see

- Merchant-configured min price, max discount, margin, rounds, expiry  
- Live audit trail beside chat  
- LLM proposal cannot bypass PolicyEngine  
- Explicit approval before Razorpay  
- One graceful failure with no false success  
