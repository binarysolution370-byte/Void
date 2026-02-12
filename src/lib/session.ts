const SESSION_KEY = "void_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}
