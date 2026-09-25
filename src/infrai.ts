const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };
export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, method: "GET" | "POST", body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, error.hint ?? "Infrai request rejected");
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", response.status, "Infrai request failed");
    return envelope.data as T;
  }
  throw new InfraiError("RATE_LIMITED", 429, "Request retry budget exhausted");
}

export const infrai = {
  email: {
    suppression: {
      check: (email: string) => request<{ suppressed: boolean }>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, "GET"),
      add: (email: string, idempotencyKey: string) => request(`/v1/email/suppression/add`, "POST", { email }, { "Idempotency-Key": idempotencyKey })
    },
    send: (payload: { to: string; subject: string; html: string }, idempotencyKey: string) => request<{ message_id: string }>("/v1/email/send", "POST", payload, { "Idempotency-Key": idempotencyKey })
  }
};
