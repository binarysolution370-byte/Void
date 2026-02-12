const HTML_TAG_REGEX = /<[^>]*>/g;

export function sanitizeSecretText(input: string): string {
  return input.replace(HTML_TAG_REGEX, "").replace(/\s+/g, " ").trim();
}

export function containsBlockedWords(content: string, blockedWords: string[]): boolean {
  const haystack = content.toLowerCase();
  return blockedWords.some((word) => haystack.includes(word));
}
