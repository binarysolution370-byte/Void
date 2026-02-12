import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createApiTestServer } from "../helpers/api-test-server";

const checkRateLimitMock = vi.fn();
const getBlockedWordsMock = vi.fn();
const getSupabaseServerClientMock = vi.fn();

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

function buildSupabaseMock(options?: { duplicate?: boolean; insertError?: string }) {
  const duplicate = options?.duplicate ?? false;
  const insertError = options?.insertError;
  return {
    from: vi.fn((table: string) => {
      if (table === "long_letter_entitlements") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              or: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: null,
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        };
      }

      if (table === "secrets") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                limit: vi.fn(async () => ({
                  data: duplicate ? [{ id: "dup" }] : [],
                  error: null
                }))
              }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () =>
                insertError
                  ? { data: null, error: { message: insertError } }
                  : {
                      data: {
                        id: "new-id",
                        content: "hello",
                        created_at: "2026-02-12T00:00:00.000Z",
                        is_reply: false,
                        parent_secret_id: null
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

describe("POST /api/secrets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 1000 });
    getBlockedWordsMock.mockReturnValue([]);
    getSupabaseServerClientMock.mockReturnValue(buildSupabaseMock());
  });

  it("returns 400 for invalid payload", async () => {
    const { POST } = await import("@/app/api/secrets/route");
    const server = createApiTestServer({ postSecrets: POST });
    const response = await request(server).post("/api/secrets").send({ wrong: true });
    server.close();

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("content");
  });

  it("returns 409 when duplicate is detected", async () => {
    getSupabaseServerClientMock.mockReturnValue(buildSupabaseMock({ duplicate: true }));
    const { POST } = await import("@/app/api/secrets/route");
    const server = createApiTestServer({ postSecrets: POST });
    const response = await request(server).post("/api/secrets").send({ content: "same secret" });
    server.close();

    expect(response.status).toBe(409);
  });

  it("returns 201 for a valid secret", async () => {
    const { POST } = await import("@/app/api/secrets/route");
    const server = createApiTestServer({ postSecrets: POST });
    const response = await request(server).post("/api/secrets").send({ content: "hello" });
    server.close();

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("new-id");
  });
});
