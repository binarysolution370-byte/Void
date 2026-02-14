# VOID Backend API

Base URL in local dev: `http://localhost:3000`

All routes accept optional header `x-session-id`.
If missing, backend creates one and returns it in response header `x-session-id`.

## POST `/api/secrets`

Create a secret.

Request body:

```json
{ "content": "Mon secret..." }
```

Rules:
- 1..300 chars after sanitization
- no HTML tags
- duplicate content rejected for 5 minutes
- rate limit: 5/hour per session

Success: `201`

```json
{
  "id": "uuid",
  "content": "Mon secret...",
  "created_at": "2026-02-12T10:00:00.000Z",
  "is_reply": false,
  "parent_secret_id": null
}
```

## GET `/api/secrets/random`

Pull next secret FIFO using DB lock (`FOR UPDATE SKIP LOCKED` via SQL function).

Rules:
- only non-delivered, non-reply secrets
- marks row delivered to current session
- rate limit: 30/hour per session

Success (secret): `200`

```json
{
  "id": "uuid",
  "content": "Secret",
  "created_at": "2026-02-12T10:00:00.000Z",
  "is_reply": false,
  "parent_secret_id": null
}
```

Success (empty): `200`

```json
{
  "empty": true,
  "message": "Le vide est silencieux."
}
```

## POST `/api/secrets/:id/reply`

Reply to a secret.

Request body:

```json
{ "content": "Ta reponse..." }
```

Rules:
- 1..200 chars
- no HTML tags
- if target secret is not a reply: max 1 reply
- if target is a reply: allowed
- rate limit: 3/hour per session

Success: `201`

```json
{
  "id": "uuid",
  "content": "Ta reponse...",
  "created_at": "2026-02-12T10:00:00.000Z",
  "is_reply": true,
  "parent_secret_id": "parent-uuid"
}
```

## POST `/api/secrets/:id/release`

Release a pulled secret back to the pool (same receiver session only).

Success: `200`

```json
{ "ok": true }
```

Not found/session mismatch: `404`

## POST `/api/payments/create-payment-intent`

Request:

```json
{
  "offerId": "long_letter_1000",
  "paymentMethod": "stripe"
}
```

Response:

```json
{
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "offer": {
    "id": "long_letter_1000",
    "featureType": "long_letter",
    "label": "Longue Lettre 1000",
    "ritualVerb": "DEPOSER",
    "amountEurCents": 99
  }
}
```

## POST `/api/payments/confirm`

Request:

```json
{
  "paymentIntentId": "pi_...",
  "provider": "stripe"
}
```

Response:

```json
{ "ok": true, "message": "C'est fait." }
```

## GET `/api/payments/history`

Returns purchase history for current session.

## POST `/api/payments/webhook`

Stripe webhook endpoint (handles `payment_intent.succeeded`).

## POST `/api/payments/sinetpay/callback`

SinetPay callback endpoint for Mobile Money confirmation.
