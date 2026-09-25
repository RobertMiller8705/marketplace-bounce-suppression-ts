import { z } from "zod";
import { infrai } from "./infrai.js";

export const HandoffRequest = z.object({ sellerId: z.string().min(1), buyerEmail: z.string().email(), orderId: z.string().min(1), update: z.string().min(1) });
export type HandoffRequest = z.infer<typeof HandoffRequest>;
export type HandoffResult = { state: "sent" | "suppressed"; messageId?: string };

export async function handoffBuyerUpdate(input: unknown): Promise<HandoffResult> {
  const request = HandoffRequest.parse(input);
  const status = await infrai.email.suppression.check(request.buyerEmail);
  if (status.suppressed) return { state: "suppressed" };
  const idempotencyKey = `order-update:${request.orderId}:${request.sellerId}`;
  const sent = await infrai.email.send({ to: request.buyerEmail, subject: `Order ${request.orderId} update`, html: `<p>${request.update}</p>` }, idempotencyKey);
  return { state: "sent", messageId: sent.message_id };
}
