"use client";

import { useEffect, useState } from "react";
import { getEchoReplies } from "@/lib/api";
import type { Reply } from "@/lib/types";

interface EchoThreadProps {
  secretId: string;
}

export function EchoThread({ secretId }: EchoThreadProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [status, setStatus] = useState("Chargement...");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("t") : null;
        const data = await getEchoReplies(secretId, token ?? undefined);
        if (!mounted) {
          return;
        }
        setReplies(data.replies);
        setStatus(data.replies.length > 0 ? "" : "Silence.");
      } catch (error) {
        if (!mounted) {
          return;
        }
        setStatus(error instanceof Error ? error.message : "Impossible de lire l'echo.");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [secretId]);

  return (
    <section className="void-container space-y-4" aria-labelledby="echo-title">
      <header className="pt-2">
        <h1
          id="echo-title"
          className="text-balance text-[32px] leading-tight"
          style={{ fontFamily: "var(--void-font-display)", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          l&apos;echo
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: "var(--void-text-secondary)", fontWeight: 300, fontStyle: "italic" }}>
          le vide a bouge.
        </p>
      </header>
      {status ? (
        <p style={{ color: "var(--void-text-ghost)", fontWeight: 300, fontStyle: "italic" }}>{status.toLowerCase()}</p>
      ) : null}
      <div className="space-y-3">
        {replies.map((reply) => (
          <article key={reply.id} className="void-glass" style={{ borderRadius: "20px", padding: "18px 18px" }}>
            <p className="whitespace-pre-wrap break-words" style={{ fontWeight: 300, fontStyle: "italic", fontSize: 16, lineHeight: 1.8 }}>
              {reply.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
