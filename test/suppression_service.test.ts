import assert from "node:assert/strict";
import { HandoffRequest } from "../src/suppression_service.js";

const accepted = HandoffRequest.safeParse({ sellerId: "seller-7", buyerEmail: "buyer@example.com", orderId: "order-42", update: "Packed and ready" });
assert.equal(accepted.success, true);
const rejected = HandoffRequest.safeParse({ sellerId: "seller-7", buyerEmail: "bad", orderId: "order-42", update: "Packed" });
assert.equal(rejected.success, false);
console.log("handoff request boundary: valid input accepted, malformed email rejected");
