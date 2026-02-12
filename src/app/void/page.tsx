import { Suspense } from "react";
import { KeptSecretsList } from "@/components/kept-secrets-list";

export default function VoidPage() {
  return (
    <Suspense fallback={<div className="void-card">Chargement...</div>}>
      <KeptSecretsList />
    </Suspense>
  );
}
