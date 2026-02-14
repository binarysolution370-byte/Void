export default function AboutPage() {
  return (
    <article className="void-container-wide pt-2">
      <h1
        className="void-title-xl void-reveal-item"
        style={{ ["--void-stagger" as never]: 0 }}
      >
        MANIFESTE
      </h1>

      <div className="void-divider mt-6" />

      <div className="void-prose mt-8 space-y-8 void-reveal-item" style={{ ["--void-stagger" as never]: 1 }}>
        <p>
          VOID est un reseau social fantome. Tu depose un secret. Tu en recueilles un autre. Personne ne suit personne.
          Personne n&apos;applaudit.
        </p>

        <p className="void-quote">Le silence est la fonctionnalite principale.</p>

        <p>Pas de profil. Pas de performance sociale. Une seule alerte possible, une seule fois: Le vide a bouge.</p>
      </div>

      <p className="void-signature mt-12 void-reveal-item" style={{ ["--void-stagger" as never]: 2 }}>
        VOID {"\u00b7"} 2026
      </p>
    </article>
  );
}

