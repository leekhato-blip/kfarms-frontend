# Billing Backend Requirements

This frontend now calls these billing endpoints from `src/services/billingService.js` and expects the contracts below.

## 1. Environment And Provider Setup
- Create a payment provider account (Paystack/Stripe/Flutterwave).  
- Add server env vars:
  - `PAYMENT_PROVIDER`
  - `PAYMENT_SECRET_KEY`
  - `PAYMENT_PUBLIC_KEY`
  - `PAYMENT_WEBHOOK_SECRET`
  - `BILLING_RETURN_BASE_URL` (for success/cancel URL validation)
- Keep all secret keys server-side only.

## 2. Data Model (Minimum)
- `subscriptions`
  - `id`, `tenant_id`, `plan_id`, `status`, `provider`, `provider_subscription_id`, `provider_customer_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `created_at`, `updated_at`
- `payments`
  - `id`, `tenant_id`, `reference`, `provider`, `amount`, `currency`, `status`, `paid_at`, `raw_payload`, `created_at`
- `invoices`
  - `id`, `tenant_id`, `reference`, `description`, `amount`, `currency`, `status`, `receipt_url`, `issued_at`, `created_at`
- `payment_webhook_events` (for idempotency)
  - `id`, `provider`, `event_id`, `event_type`, `processed_at`, `raw_payload`

## 3. Plan Pricing Source Of Truth
- Store plan pricing server-side (`FREE`, `PRO`, `ENTERPRISE`) and never trust client amounts.
- Validate requested `planId` against this catalog before creating checkout sessions.

## 4. API Contract Needed By Frontend
All endpoints are tenant-scoped and must respect `X-Tenant-Id`.

### `GET /api/billing/overview`
Response:
```json
{
  "planId": "PRO",
  "status": "ACTIVE",
  "amount": 25000,
  "currency": "NGN",
  "interval": "MONTHLY",
  "provider": "PAYSTACK",
  "nextBillingDate": "2026-04-03T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "subscriptionReference": "SUB_123",
  "paymentMethodBrand": "visa",
  "paymentMethodLast4": "4242",
  "updatedAt": "2026-03-03T10:00:00.000Z"
}
```

### `GET /api/billing/invoices?page=0&size=10`
Response:
```json
{
  "items": [
    {
      "id": "INV_123",
      "createdAt": "2026-03-03T10:00:00.000Z",
      "description": "PRO subscription payment",
      "amount": 25000,
      "currency": "NGN",
      "status": "PAID",
      "reference": "TXN_123",
      "downloadUrl": "https://..."
    }
  ],
  "page": 0,
  "totalPages": 1
}
```

### `POST /api/billing/checkout/session`
Request:
```json
{
  "planId": "PRO",
  "successUrl": "https://app.example.com/billing",
  "cancelUrl": "https://app.example.com/billing?paymentStatus=cancelled",
  "customerEmail": "owner@farm.com"
}
```
Response:
```json
{
  "checkoutUrl": "https://provider-checkout-url",
  "reference": "TXN_123",
  "provider": "PAYSTACK",
  "amount": 25000,
  "currency": "NGN"
}
```

### `POST /api/billing/checkout/verify`
Request:
```json
{
  "reference": "TXN_123",
  "planId": "PRO"
}
```
Response:
```json
{
  "billing": {
    "planId": "PRO",
    "status": "ACTIVE",
    "amount": 25000,
    "currency": "NGN",
    "interval": "MONTHLY",
    "provider": "PAYSTACK",
    "nextBillingDate": "2026-04-03T00:00:00.000Z"
  },
  "invoice": {
    "id": "INV_123",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "description": "PRO subscription payment",
    "amount": 25000,
    "currency": "NGN",
    "status": "PAID",
    "reference": "TXN_123",
    "downloadUrl": "https://..."
  }
}
```

### `POST /api/billing/subscription/cancel`
- Marks subscription to cancel at period end.

### `POST /api/billing/subscription/downgrade`
Request:
```json
{
  "planId": "FREE"
}
```
- Immediate or scheduled downgrade, depending on your business rule.

### `POST /api/billing/portal/session`
Request:
```json
{
  "returnUrl": "https://app.example.com/billing"
}
```
Response:
```json
{
  "portalUrl": "https://provider-customer-portal-url"
}
```

## 5. Webhooks (Critical)
- Add webhook endpoint e.g. `POST /api/billing/webhook/paystack`.
- Verify signature before processing.
- Process idempotently using `event_id`.
- Handle at least:
  - payment success
  - payment failure
  - subscription created/updated/cancelled
  - charge dispute/refund (if supported)
- Update `subscriptions`, `payments`, and `invoices` atomically.

## 6. Security Rules
- Validate tenant ownership for every billing operation.
- Never accept amount/currency from client as final truth.
- Enforce allowed plan transitions (e.g., FREE -> PRO, PRO -> FREE).
- Protect against replay/idempotency issues on verify and webhook handlers.

## 7. After Backend Is Live
- Frontend will automatically stop using placeholder mode when these endpoints return 2xx responses.
- Optional: remove placeholder storage logic from `billingService` after rollout hardening.
