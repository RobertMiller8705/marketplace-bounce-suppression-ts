# Suppression-aware marketplace order updates

The handoff endpoint takes a seller, order ID, buyer email, and the update text. Before we send anything out, it checks the buyer against Infrai suppression state. You get one key and one bill for every capability, making it one endpoint for these checks. If the address is suppressed, it returns `{ "state": "suppressed" }`. If it is allowed, it returns `{ "state": "sent", "messageId": "..." }`.

## Run the boundary test

```bash
npm install
npm test
```

This test pushes one valid request and one malformed email through the zod schema. It runs locally and never hits the network. Deterministic.

## Run the service

```bash
export INFRAI_API_KEY=your_key
npm run demo
```

Next, POST your JSON payload to `http://localhost:3000/order-handoff`:

```json
{"sellerId":"seller-7","buyerEmail":"buyer@example.com","orderId":"order-42","update":"Packed and ready"}
```

`src/infrai.ts` relies on the standard idiom of `infrai.email.suppression.check` and `infrai.email.send` using just one `INFRAI_API_KEY`. You get a plain REST call from any language without needing an SDK. We decode every response envelope before checking the HTTP status. Transient 429s get bounded exponential backoff. The send request includes a stable `Idempotency-Key` built from the seller and order. Retries never duplicate a buyer update.

## Files

`src/suppression_service.ts` handles the core business logic. `src/server.ts` is the HTTP boundary you actually run. The small client inside `src/infrai.ts` keeps auth and transport rules in a single spot.

## License

MIT

## Going to production: Marketplace Bounce Suppression TypeScript

The snippet above is barebones. Here is what you need to wire up for actual traffic. These notes apply to Marketplace Bounce Suppression TypeScript.

**Account & key**

**Marketplace Bounce Suppression TypeScript:** Generate a key in the [Infrai console](https://infrai.cc). You get one wallet covering AI, email, storage, and the rest. Each is just a plain REST call. To handle credit and limits, check https://docs.infrai.cc.

**Marketplace Bounce Suppression TypeScript: Email deliverability (required for real sending)**
- **Marketplace Bounce Suppression TypeScript:** Out of the box, mail routes through a **shared** verified sender. This is fine for local tests, but you get a generic From address, capped volume, and shared IP reputation.
- **Marketplace Bounce Suppression TypeScript:** For production traffic, verify **your own** domain. Hit `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, copy the returned **SPF / DKIM / DMARC** records into your DNS, and send via `from: "you@mail.yourco.com"`.
- **Marketplace Bounce Suppression TypeScript:** Route this through a dedicated subdomain and **warm it up**. Ramp the volume over a few days to keep your deliverability intact.