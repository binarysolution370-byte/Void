import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiTestServer } from "../helpers/api-test-server";

const checkRateLimitMock = vi.fn();
const getSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock
}));

vi.mock("@/lib/server/supabase", () => ({
  getSupabaseServerClient: getSupabaseServerClientMock
}));

describe("GET /api/secrets/random", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ success: true, remaining: 29, reset: Date.now() + 1000 });
  });

  it("returns empty payload when no secret exists", async () => {
    getSupabaseServerClientMock.mockReturnValue({
      rpc: vi.fn(async () => ({ data: [], error: null }))
    });

    const { GET } = await import("@/app/api/secrets/random/route");
    const server = createApiTestServer({ getRandom: GET });
    const response = await request(server).get("/api/secrets/random");
    server.close();

    expect(response.status).toBe(200);
    expect(response.body.empty).toBe(true);
  });

  it("returns one secret payload", async () => {
    getSupabaseServerClientMock.mockReturnValue({
      rpc: vi.fn(async () => ({
        data: [
          {
            id: "s-1",
            content: "secret",
            created_at: "2026-02-12T00:00:00.000Z",
            is_reply: false,
            parent_secret_id: null
          }
        ],
        error: null
      }))
    });

    const { GET } = await import("@/app/api/secrets/random/route");
    const server = createApiTestServer({ getRandom: GET });
    const response = await request(server).get("/api/secrets/random");
    server.close();

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("s-1");
  });
});
