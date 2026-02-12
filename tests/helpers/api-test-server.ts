import { createServer, IncomingMessage, ServerResponse } from "http";
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: { params: { id: string } }) => Promise<Response>;

interface ApiHandlers {
  postSecrets?: RouteHandler;
  getRandom?: RouteHandler;
  postReply?: RouteHandler;
  postRelease?: RouteHandler;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function toNextRequest(req: IncomingMessage, body: string): NextRequest {
  const host = req.headers.host ?? "localhost";
  const fullUrl = `http://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  });

  const method = req.method ?? "GET";
  const init: RequestInit = { method, headers };
  if (body.length > 0 && method !== "GET" && method !== "HEAD") {
    init.body = body;
  }

  return new NextRequest(new Request(fullUrl, init));
}

async function writeResponse(response: Response, res: ServerResponse) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const payload = await response.text();
  res.end(payload);
}

export function createApiTestServer(handlers: ApiHandlers) {
  return createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const path = (req.url ?? "/").split("?")[0];
    const body = await readBody(req);
    const nextReq = toNextRequest(req, body);

    if (method === "POST" && path === "/api/secrets" && handlers.postSecrets) {
      const response = await handlers.postSecrets(nextReq);
      return writeResponse(response, res);
    }

    if (method === "GET" && path === "/api/secrets/random" && handlers.getRandom) {
      const response = await handlers.getRandom(nextReq);
      return writeResponse(response, res);
    }

    const replyMatch = path.match(/^\/api\/secrets\/([^/]+)\/reply$/);
    if (method === "POST" && replyMatch && handlers.postReply) {
      const response = await handlers.postReply(nextReq, { params: { id: replyMatch[1] } });
      return writeResponse(response, res);
    }

    const releaseMatch = path.match(/^\/api\/secrets\/([^/]+)\/release$/);
    if (method === "POST" && releaseMatch && handlers.postRelease) {
      const response = await handlers.postRelease(nextReq, { params: { id: releaseMatch[1] } });
      return writeResponse(response, res);
    }

    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
  });
}
