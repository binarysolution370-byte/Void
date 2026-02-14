import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiTestServer } from "../helpers/api-test-server";

const checkRateLimitMock = vi.fn();
const getBlockedWordsMock = vi.fn();
const getSupabaseServerClientMock = vi.fn();
const triggerFirstEchoNotificationMock = vi.fn();

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock
}));

vi.mock("@/lib/server/env", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/server/env")>();
  return {
    ...original,
    getBlockedWords: getBlockedWordsMock
  };
});

vi.mock("@/lib/server/supabase", () => ({
  getSupabaseServerClient: getSupabaseServerClientMock
}));

vi.mock("@/lib/server/echo", () => ({
  triggerFirstEchoNotification: triggerFirstEchoNotificationMock
}));

function buildSupabaseMock(options?: { ownSecret?: boolean; duplicate?: boolean }) {
  const ownSecret = options?.ownSecret ?? false;
  const duplicate = options?.duplicate ?? false;
  return {
    from: vi.fn((table: string) => {
      if (table === "secrets") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { id: "secret-1", author_session_id: ownSecret ? "session-test" : "other-session" },
                error: null
              }))
            }))
          }))
        };
      }

      if (table === "replies") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () =>
                duplicate
                  ? { data: null, error: { code: "23505", message: "duplicate key value" } }
                  : {
                      data: {
                        id: "reply-1",
                        secret_id: "secret-1",
                        content: "echo",
                        created_at: "2026-02-12T00:00:00.000Z"
                      },
                      error: null
                    }
              )
            }))
          }))
        };
      }

      throw new Error(`Unexpected table ${table}`);
    })
  };
}

describe("POST /api/secrets/:id/reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ success: true, remaining: 2, reset: Date.now() + 1000 });
    getBlockedWordsMock.mockReturnValue([]);
    triggerFirstEchoNotificationMock.mockResolvedValue(undefined);
    getSupabaseServerClientMock.mockReturnValue(buildSupabaseMock());
  });

  it("blocks self-reply", async () => {
    getSupabaseServerClientMock.mockReturnValue(buildSupabaseMock({ ownSecret: true }));
    const { POST } = await import("@/app/api/secrets/[id]/reply/route");
    const server = createApiTestServer({ postReply: POST });
    const response = await request(server).post("/api/secrets/secret-1/reply").set("x-session-id", "session-test").send({ content: "nope" });
    server.close();

    expect(response.status).toBe(403);
  });

  it("returns 409 when duplicate reply exists", async () => {
    getSupabaseServerClientMock.mockReturnValue(buildSupabaseMock({ duplicate: true }));
    const { POST } = await import("@/app/api/secrets/[id]/reply/route");
    const server = createApiTestServer({ postReply: POST });
    const response = await request(server).post("/api/secrets/secret-1/reply").send({ content: "echo" });
    server.close();

    expect(response.status).toBe(409);
  });

  it("creates a reply", async () => {
    const { POST } = await import("@/app/api/secrets/[id]/reply/route");
    const server = createApiTestServer({ postReply: POST });
    const response = await request(server).post("/api/secrets/secret-1/reply").send({ content: "echo" });
    server.close();

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("reply-1");
    expect(triggerFirstEchoNotificationMock).toHaveBeenCalledTimes(1);
  });
});
