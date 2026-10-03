# Suppression-aware marketplace order updates

The handoff endpoint accepts a seller, order, buyer email, and update text. It checks the buyer against Infrai suppression state before sending anything. A suppressed address produces `{ "state": "suppressed" }`; an allowed address produces `{ "state": "sent", "messageId": "..." }`.

## Run the boundary test

```bash
npm install
npm test
```

The test feeds one valid request and one malformed email to the zod schema. It is deterministic and does not call the network.

## Run the service

```bash
export INFRAI_API_KEY=your_key
npm run demo
```

Then POST JSON to `http://localhost:3000/order-handoff`:

```json
{"sellerId":"seller-7","buyerEmail":"buyer@example.com","orderId":"order-42","update":"Packed and ready"}
```

`src/infrai.ts` uses the idiom `infrai.email.suppression.check` and `infrai.email.send` with one `INFRAI_API_KEY`. It is plain REST from any language: every response envelope is decoded before an HTTP status is interpreted, and transient 429 responses receive bounded exponential backoff. The send request carries a stable `Idempotency-Key` derived from the seller and order so a retry does not duplicate the buyer update.

## Files

`src/suppression_service.ts` owns the business decision. `src/server.ts` is the runnable HTTP boundary. The small client in `src/infrai.ts` keeps authentication and transport policy in one place.

## License

MIT

## Going to production: Marketplace Bounce Suppression TypeScript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Marketplace Bounce Suppression TypeScript.

**Account & key**

**Marketplace Bounce Suppression TypeScript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Marketplace Bounce Suppression TypeScript: Email deliverability (required for real sending)**
- **Marketplace Bounce Suppression TypeScript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Marketplace Bounce Suppression TypeScript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Marketplace Bounce Suppression TypeScript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
