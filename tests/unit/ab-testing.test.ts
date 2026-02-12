import { describe, expect, it } from "vitest";
import { getVariant } from "@/lib/ab-testing";

describe("ab testing", () => {
  it("returns deterministic variant", () => {
    const a = getVariant("session-123", "button_naming");
    const b = getVariant("session-123", "button_naming");
    expect(a).toBe(b);
    expect(["A", "B"]).toContain(a);
  });
});
