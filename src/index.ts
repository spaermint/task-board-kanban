import "./db/schema";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { boardsRoute } from "./routes/boards";
import { columnsRoute } from "./routes/columns";
import { tasksRoute } from "./routes/tasks";
import { wsHandler } from "./websocket/handler";
import { join } from "path";
import { existsSync } from "fs";

const DIST = join(process.cwd(), "frontend", "dist");

// Map file extensions to MIME types
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function serveStatic(pathname: string) {
  if (pathname === "/") pathname = "/index.html";
  const filePath = join(DIST, pathname);

  // Security check
  if (!filePath.startsWith(DIST)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  // Read file and get extension
  const file = Bun.file(filePath);
  const ext = "." + pathname.split(".").pop()?.toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  // Return with proper Content-Type header
  return new Response(file, {
    headers: { "Content-Type": contentType },
  });
}

const app = new Elysia()
  .use(cors())
  .use(wsHandler)
  .use(boardsRoute)
  .use(columnsRoute)
  .use(tasksRoute)
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .get("*", ({ request }) => {
    const url = new URL(request.url);
    return serveStatic(url.pathname);
  })
  .listen(process.env.PORT || 3000);

console.log(`🦊 Server running at http://localhost:${app.server?.port}`);