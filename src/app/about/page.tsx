export default function AboutPage() {
  return (
    <article className="void-container-wide pt-2">
      <h1
        className="text-[48px] leading-tight void-reveal-item"
        style={{ fontFamily: "var(--void-font-display)", fontWeight: 800, letterSpacing: "-0.02em", ["--void-stagger" as never]: 0 }}
      >
        MANIFESTE
      </h1>

      <div style={{ borderTop: "1px solid var(--void-border)", marginTop: 24 }} />

      <div
        className="mt-8 space-y-8 void-reveal-item"
        style={{ fontWeight: 300, fontSize: 17, lineHeight: 1.9, ["--void-stagger" as never]: 1 }}
      >
        <p>
          VOID est un reseau social fantome. Tu depose un secret. Tu en recueilles un autre. Personne ne suit personne.
          Personne n&apos;applaudit.
        </p>

        <p style={{ fontStyle: "italic", fontSize: 22, color: "var(--void-glow)" }}>
          Le silence est la fonctionnalite principale.
        </p>

        <p>Pas de profil. Pas de performance sociale. Une seule alerte possible, une seule fois: Le vide a bouge.</p>
      </div>

      <p
        className="mt-12 text-center void-reveal-item"
        style={{
          fontFamily: "var(--void-font-display)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.3em",
          color: "var(--void-text-ghost)",
          textTransform: "uppercase",
          ["--void-stagger" as never]: 2
        }}
      >
        VOID · 2026
      </p>
    </article>
  );
}
