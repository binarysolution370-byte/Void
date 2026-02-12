# VOID Monetization Spec (Invisible Ritual)

## Principles implemented

1. No feature removed from free core.
2. Paid options hidden in secondary UI (`<details>` blocks).
3. Monetization unlocks only after 7 days of usage (`localStorage` first seen gate).
4. Copy avoids "premium/upgrade/buy"; uses ritual language.

## Paid React components

- `src/components/offer-long-letter.tsx`
- `src/components/offer-capsule.tsx`
- `src/components/offer-seal.tsx`
- `src/components/offer-paper.tsx`
- `src/components/offer-ink.tsx`
- `src/components/offer-gift.tsx`
- `src/components/offer-sanctuary.tsx`
- `src/components/offer-eternity.tsx`
- `src/components/seasonal-ritual.tsx`

## Stripe APIs

- `POST /api/payments/create-payment-intent`
- `POST /api/payments/confirm`
- `GET /api/payments/history`
- `POST /api/payments/webhook`

## Event tracking model (admin only)

Recommended event names:

1. `ritual_offer_seen`
2. `ritual_offer_opened`
3. `ritual_checkout_started`
4. `ritual_checkout_completed`
5. `ritual_checkout_abandoned`
6. `ritual_entitlement_granted`

Recommended event payload:

```json
{
  "session_id": "string",
  "feature_type": "long_letter|capsule|seal|paper|ink|gift|sanctuary|eternity",
  "offer_id": "string",
  "variant": "A|B",
  "created_at": "ISO-8601"
}
```

## A/B testing hook

- `src/lib/ab-testing.ts`
- Deterministic assignment by `session_id + test_name`.

Tests prepared for:

1. Offer position (under textarea vs details menu)
2. Label (`OFFRIR` vs `DEPOSER` vs `SCELLER`)
3. Timing (writing vs reread)
4. Price point (`0.99` vs `1.49`)

## Revenue estimate (12 months, conservative)

Assumptions:

- MAU month 1: 1,000
- MAU growth: +20% monthly
- Conversion: 3.5%
- Average basket: 2.50 EUR

| Month | MAU | Buyers (3.5%) | Revenue EUR |
| --- | ---: | ---: | ---: |
| 1 | 1,000 | 35 | 87.50 |
| 2 | 1,200 | 42 | 105.00 |
| 3 | 1,440 | 50 | 125.00 |
| 4 | 1,728 | 60 | 150.00 |
| 5 | 2,074 | 73 | 182.50 |
| 6 | 2,488 | 87 | 217.50 |
| 7 | 2,986 | 105 | 262.50 |
| 8 | 3,583 | 125 | 312.50 |
| 9 | 4,299 | 150 | 375.00 |
| 10 | 5,159 | 181 | 452.50 |
| 11 | 6,191 | 217 | 542.50 |
| 12 | 7,429 | 260 | 650.00 |

Projected year-1 revenue: ~3,462.50 EUR.

## Progressive rollout plan

1. Week 1: no paid feature visible (collect baseline behavior).
2. Week 2: Longue Lettre only, hidden in details.
3. Week 3: Capsule + Sceau for 20% sessions (A/B gate).
4. Week 4: Paper + Ink for all eligible sessions (7+ days).
5. Week 5: Gift feature (`Un vide pour deux`) soft launch.
6. Week 6: Sanctuary cloud plans.
7. Week 7: Mur des Disparus with moderation checklist.

## Moderation with paid content

1. Disallow illegal content exactly like free content (no paid immunity).
2. If content removed, keep purchase row but flag metadata for refund policy handling.
3. For eternal secrets, add manual review queue before preservation marker.
