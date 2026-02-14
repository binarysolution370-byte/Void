import { Suspense } from "react";
import { KeptSecretsList } from "@/components/kept-secrets-list";

export default function VoidPage() {
  return (
    <Suspense fallback={<div className="void-container void-reveal-item">chargement...</div>}>
      <div className="void-reveal-item" style={{ ["--void-stagger" as never]: 0 }}>
        <KeptSecretsList />
      </div>
    </Suspense>
  );
}
