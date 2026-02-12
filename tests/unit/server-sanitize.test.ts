import { describe, expect, it } from "vitest";
import { containsBlockedWords, sanitizeSecretText } from "@/lib/server/sanitize";

describe("server sanitize utils", () => {
  it("strips HTML tags and trims spaces", () => {
    const input = "  <b>Hello</b>   <script>alert(1)</script> world  ";
    const result = sanitizeSecretText(input);
    expect(result).toBe("Hello alert(1) world");
  });

  it("detects blocked words", () => {
    const blocked = ["spam", "scam"];
    expect(containsBlockedWords("This looks like SPAM", blocked)).toBe(true);
    expect(containsBlockedWords("clean message", blocked)).toBe(false);
  });
});
