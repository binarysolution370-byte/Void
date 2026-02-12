export type AbVariant = "A" | "B";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getVariant(sessionId: string, testName: string): AbVariant {
  const hash = hashString(`${sessionId}:${testName}`);
  return hash % 2 === 0 ? "A" : "B";
}
