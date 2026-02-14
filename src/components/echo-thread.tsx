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
    <section className="void-card space-y-4" aria-labelledby="echo-title">
      <p className="void-kicker">L&apos;Echo</p>
      <h1 id="echo-title" className="text-2xl font-semibold sm:text-3xl">
        Le vide a parle
      </h1>
      <div className="void-accent-line" />
      {status ? <p className="void-muted text-sm">{status}</p> : null}
      <div className="space-y-3">
        {replies.map((reply) => (
          <article key={reply.id} className="border border-white/20 bg-black/30 p-3">
            <p className="whitespace-pre-wrap break-words">{reply.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
