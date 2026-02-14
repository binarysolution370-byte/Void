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
        <h1 id="echo-title" className="void-title-lg text-balance">
          l&apos;echo
        </h1>
        <p className="void-subtext void-subtext--secondary mt-2">
          le vide a bouge.
        </p>
      </header>
      {status ? (
        <p className="void-note">{status.toLowerCase()}</p>
      ) : null}
      <div className="space-y-3">
        {replies.map((reply) => (
          <article key={reply.id} className="void-glass void-glass--strong" style={{ borderRadius: "20px", padding: "18px 18px" }}>
            <p className="whitespace-pre-wrap break-words void-kept-text" style={{ lineHeight: 1.8 }}>
              {reply.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
