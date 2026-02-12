"use client";

import { useEffect } from "react";
import { getSessionId } from "@/lib/session";

const TRACKING_FLAG_KEY = "void_visit_tracked_once";

export function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const alreadyTracked = sessionStorage.getItem(TRACKING_FLAG_KEY);
    if (alreadyTracked) {
      return;
    }

    const sessionId = getSessionId();
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId
      },
      keepalive: true
    }).finally(() => {
      sessionStorage.setItem(TRACKING_FLAG_KEY, "1");
    });
  }, []);

  return null;
}
