"use client";

import { useEffect, useRef } from "react";

// Weighted pool (40% vulnerable / 30% confessions / 20% hopeful / 10% mysterious)
const SECRET_POOL = {
  vulnerable: [
    "j'ai peur que les gens voient a travers moi",
    "je fais semblant d'etre occupe pour pas repondre",
    "j'ai pleure dans ma voiture ce matin",
    "j'ai besoin qu'on me dise que ca va aller",
    "je me sens seul meme entoure de monde",
    "parfois je veux juste qu'on me demande vraiment comment je vais",
    "j'ai envie de tout recommencer ailleurs",
    "j'aurais voulu qu'on remarque quelque chose",
    "j'ai plus d'energie pour faire semblant",
    "je me sens invisible depuis des semaines",
    "je sais pas si je vais bien",
    "je garde tout pour moi"
  ],
  confessions: [
    "je relis nos vieilles conversations parfois",
    "j'aurais du dire non ce soir-la",
    "je pense encore a toi",
    "je me compare a tout le monde tout le temps",
    "j'ai menti pour pas les decevoir",
    "je regrette encore ce que j'ai dit",
    "j'ai dit que j'allais bien alors que non",
    "j'avais besoin d'aide et j'ai rien dit",
    "j'ai rompu parce que j'avais peur",
    "j'ai laisse partir quelqu'un que j'aurais du retenir"
  ],
  hopeful: [
    "je crois que ca va finir par aller",
    "j'ai decide de changer quelque chose cette semaine",
    "pour la premiere fois j'ai pas eu honte",
    "j'ai ri aujourd'hui. vraiment ri.",
    "demain je recommence",
    "je commence a m'accepter un peu plus",
    "j'ai ose quelque chose aujourd'hui",
    "quelqu'un m'a vu et ca m'a sauve"
  ],
  mysterious: [
    "personne sait que j'ai recommence",
    "depuis ce soir-la, rien est pareil",
    "j'attends quelque chose que je saurais pas nommer",
    "je sais un truc que tout le monde ignore",
    "j'ai pris une decision que je dirai jamais a voix haute"
  ]
};

function buildWeightedPool(): string[] {
  const { vulnerable, confessions, hopeful, mysterious } = SECRET_POOL;
  return [
    ...vulnerable,
    ...vulnerable,
    ...vulnerable,
    ...vulnerable,
    ...confessions,
    ...confessions,
    ...confessions,
    ...hopeful,
    ...hopeful,
    ...mysterious
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function truncate(text: string, max = 78): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

const CARD_WIDTH = 210;
const CENTER_SAFE_WIDTH = 520;
const LATERAL_MARGIN = 16;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getCardX(): number {
  const W = window.innerWidth;
  if (W < 640) {
    const maxX = W - CARD_WIDTH - 8;
    return Math.max(0, Math.random() * Math.max(0, maxX));
  }

  const centerLeft = (W - CENTER_SAFE_WIDTH) / 2;
  const centerRight = centerLeft + CENTER_SAFE_WIDTH;

  const leftMax = centerLeft - LATERAL_MARGIN - CARD_WIDTH;
  const rightMin = centerRight + LATERAL_MARGIN;
  const rightMax = W - CARD_WIDTH - 8;

  const hasLeft = leftMax > 8;
  const hasRight = rightMax > rightMin;

  if (hasLeft && hasRight) {
    return Math.random() < 0.5 ? Math.random() * leftMax : rightMin + Math.random() * (rightMax - rightMin);
  }
  if (hasLeft) return Math.random() * leftMax;
  if (hasRight) return rightMin + Math.random() * Math.max(0, rightMax - rightMin);
  return 8;
}

function createCard(secret: string, x: number, duration: number, delay: number, tilt: number, ember: boolean): HTMLDivElement {
  const card = document.createElement("div");
  card.className = `ghost-card${ember ? " ember" : ""}`;
  card.style.setProperty("--tilt", `${tilt}deg`);
  card.style.setProperty("--dot-delay", `${(Math.random() * 2).toFixed(2)}s`);
  card.style.left = `${Math.round(x)}px`;
  // Keyframes already move from below-screen to above-screen via translateY(vh).
  // Anchoring with bottom offsets would push cards out of the viewport permanently.
  card.style.top = "0px";
  // Prevent a one-frame flash at the top before the animation applies.
  card.style.opacity = "0";
  card.style.transform = `translateY(108vh) rotate(${tilt}deg) scale(0.93)`;
  card.style.animation = `cardRise ${duration}s linear ${delay}s both`;

  const text = document.createElement("div");
  text.className = "card-text";
  text.textContent = truncate(secret);

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const dot = document.createElement("div");
  dot.className = "card-dot";

  const label = document.createElement("div");
  label.className = "card-label";
  label.textContent = "anonyme";

  meta.appendChild(dot);
  meta.appendChild(label);
  card.appendChild(text);
  card.appendChild(meta);

  return card;
}

export function GhostStream() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stream = ref.current;
    if (!stream) return;
    if (prefersReducedMotion()) return;

    const CONFIG = {
      maxCards: 7,
      minCards: 4,
      durationMin: 22,
      durationMax: 36,
      spawnInterval: 3800,
      spawnVariance: 2000,
      emberChance: 0.2,
      tiltRange: 2.8,
      mobileMaxCards: 3
    };

    let pool = shuffle(buildWeightedPool());
    let poolIndex = 0;

    function nextSecret(): string {
      const s = pool[poolIndex % pool.length] ?? "je garde ca pour moi";
      poolIndex += 1;
      if (poolIndex >= pool.length) {
        pool = shuffle(buildWeightedPool());
        poolIndex = 0;
      }
      return s;
    }

    let activeCards = 0;
    let loopTimer: number | null = null;
    let started = false;

    function spawnCard(negativeDelay = 0) {
      if (!ref.current) return;
      const mobile = window.innerWidth < 640;
      const maxC = mobile ? CONFIG.mobileMaxCards : CONFIG.maxCards;
      if (activeCards >= maxC) return;

      const duration =
        CONFIG.durationMin + Math.random() * Math.max(0, CONFIG.durationMax - CONFIG.durationMin);
      const delay = negativeDelay !== 0 ? negativeDelay : 0;
      const tilt = (Math.random() - 0.5) * CONFIG.tiltRange * 2;
      const ember = Math.random() < CONFIG.emberChance;

      const card = createCard(nextSecret(), getCardX(), duration, delay, tilt, ember);
      ref.current.appendChild(card);
      activeCards += 1;

      const removeAfter = (duration + Math.abs(delay) + 0.6) * 1000;
      window.setTimeout(() => {
        card.remove();
        activeCards = Math.max(0, activeCards - 1);
      }, removeAfter);
    }

    function initialBurst() {
      const count = window.innerWidth < 640 ? 3 : 5;
      for (let i = 0; i < count; i += 1) {
        const duration =
          CONFIG.durationMin + Math.random() * Math.max(0, CONFIG.durationMax - CONFIG.durationMin);
        // Start in the middle band so at least some cards are visible immediately (not hidden by masks).
        const negDelay = -((0.3 + Math.random() * 0.4) * duration);
        spawnCard(negDelay);
      }
    }

    function scheduleLoop() {
      const mobile = window.innerWidth < 640;
      const maxC = mobile ? CONFIG.mobileMaxCards : CONFIG.maxCards;
      const minC = mobile ? 1 : CONFIG.minCards;
      const jitter = (Math.random() - 0.5) * CONFIG.spawnVariance;
      const next = Math.max(900, CONFIG.spawnInterval + jitter);

      loopTimer = window.setTimeout(() => {
        if (activeCards < minC) {
          spawnCard();
          spawnCard();
        } else if (activeCards < maxC) {
          spawnCard();
        }
        scheduleLoop();
      }, next);
    }

    function setPlayState(state: "running" | "paused") {
      const root = ref.current;
      if (!root) return;
      const cards = root.querySelectorAll<HTMLElement>(".ghost-card");
      cards.forEach((card) => {
        card.style.animationPlayState = state;
      });
    }

    function start() {
      if (started) return;
      started = true;
      initialBurst();
      scheduleLoop();
    }

    function stop() {
      if (loopTimer) {
        window.clearTimeout(loopTimer);
        loopTimer = null;
      }
      started = false;
    }

    if (document.visibilityState === "visible") {
      start();
    } else {
      const once = () => {
        if (document.visibilityState === "visible") {
          start();
          document.removeEventListener("visibilitychange", once);
        }
      };
      document.addEventListener("visibilitychange", once);
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setPlayState("paused");
        stop();
        return;
      }
      setPlayState("running");
      start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Keep cards out of center on resize (new spawns will follow new bounds).
    const onResize = () => {
      // no-op: bounds are computed per spawn.
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      stop();
      if (ref.current) {
        ref.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <>
      <div id="ghost-stream" ref={ref} aria-hidden="true" />
      <div className="stream-mask-top" aria-hidden="true" />
      <div className="stream-mask-bottom" aria-hidden="true" />
    </>
  );
}
