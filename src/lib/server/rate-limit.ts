import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RuleName = "create-secret" | "pull-secret" | "reply-secret";

interface RuleConfig {
  limit: number;
  window: "1 h";
}

const rules: Record<RuleName, RuleConfig> = {
  "create-secret": { limit: 5, window: "1 h" },
  "pull-secret": { limit: 30, window: "1 h" },
  "reply-secret": { limit: 3, window: "1 h" }
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, rule: RuleConfig) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: rule.limit - 1, reset: resetAt };
  }

  if (entry.count >= rule.limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: rule.limit - entry.count, reset: entry.resetAt };
}

let cachedRedis: Redis | null = null;
const limiterByRule: Partial<Record<RuleName, Ratelimit>> = {};

function getUpstashRedis(): Redis | null {
  if (cachedRedis) {
    return cachedRedis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

export async function checkRateLimit(ruleName: RuleName, sessionId: string) {
  const rule = rules[ruleName];
  const key = `${ruleName}:${sessionId}`;

  const redis = getUpstashRedis();
  if (!redis) {
    return memoryLimit(key, rule);
  }

  if (!limiterByRule[ruleName]) {
    limiterByRule[ruleName] = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(rule.limit, rule.window),
      analytics: false,
      prefix: "void-rl"
    });
  }

  return limiterByRule[ruleName]!.limit(key);
}
