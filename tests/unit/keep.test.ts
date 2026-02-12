// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { getKeptSecrets, keepSecret, removeKeptSecret } from "@/lib/keep";

describe("keep utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads kept secrets", () => {
    keepSecret({
      id: "s1",
      content: "hello",
      keptAt: "2026-02-12T00:00:00.000Z"
    });

    const kept = getKeptSecrets();
    expect(kept).toHaveLength(1);
    expect(kept[0]?.id).toBe("s1");
  });

  it("does not duplicate same secret id", () => {
    const payload = { id: "s1", content: "same", keptAt: "2026-02-12T00:00:00.000Z" };
    keepSecret(payload);
    keepSecret(payload);
    expect(getKeptSecrets()).toHaveLength(1);
  });

  it("removes a kept secret", () => {
    keepSecret({ id: "s1", content: "a", keptAt: "2026-02-12T00:00:00.000Z" });
    keepSecret({ id: "s2", content: "b", keptAt: "2026-02-12T00:00:00.000Z" });

    removeKeptSecret("s1");
    const kept = getKeptSecrets();
    expect(kept).toHaveLength(1);
    expect(kept[0]?.id).toBe("s2");
  });
});
