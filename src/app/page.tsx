import { SecretForm } from "@/components/secret-form";
import { SecretReceiver } from "@/components/secret-receiver";
import { LivePulse } from "@/components/live-pulse";

export default function HomePage() {
  return (
    <div className="void-container space-y-5">
      <header className="pt-2 void-reveal-item" style={{ ["--void-stagger" as never]: 0 }}>
        <h1 className="void-title-lg text-balance">
          laisse tomber.
          <br />
          tire. repars.
        </h1>
        <div className="mt-3">
          <LivePulse />
        </div>
      </header>
      <div className="void-reveal-item" style={{ ["--void-stagger" as never]: 1 }}>
        <SecretForm />
      </div>
      <div className="void-reveal-item" style={{ ["--void-stagger" as never]: 2 }}>
        <SecretReceiver />
      </div>
    </div>
  );
}
