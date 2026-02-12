import { SecretForm } from "@/components/secret-form";
import { SecretReceiver } from "@/components/secret-receiver";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="void-hero">
        <p className="void-kicker mb-3">Reseau social fantome</p>
        <h1 className="void-display mb-4">Laisse tomber. Tire. Repars.</h1>
        <p className="max-w-2xl text-sm sm:text-base">
          VOID capte l&apos;attention des la premiere seconde, puis coupe le bruit. Aucun profil, aucune validation,
          juste des secrets anonymes qui circulent.
        </p>
      </section>
      <SecretForm />
      <SecretReceiver />
    </div>
  );
}
