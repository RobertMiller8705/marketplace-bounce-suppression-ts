import { createServer } from "node:http";
import { handoffBuyerUpdate } from "./suppression_service.js";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/order-handoff") { response.writeHead(404).end(); return; }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  try {
    const result = await handoffBuyerUpdate(JSON.parse(raw));
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof SyntaxError || error?.constructor?.name === "ZodError" ? 400 : 502;
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "request_rejected" }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("order handoff listening on http://localhost:3000/order-handoff"));
