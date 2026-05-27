import { Elysia } from "elysia";

const clients = new Set<any>();

export function broadcast(event: string, data: any) {
  const payload = JSON.stringify({ event, data });
  for (const client of clients) {
    client.send(payload);
  }
}

export const wsHandler = new Elysia()
  .ws("/ws", {
    open(ws) {
      clients.add(ws);
      console.log(`🔌 Client connected. Total: ${clients.size}`);
    },

    message(ws, message) {
      console.log("📩 Received:", message);
    },

    close(ws) {
      clients.delete(ws);
      console.log(`🔌 Client disconnected. Total: ${clients.size}`);
    },
  });