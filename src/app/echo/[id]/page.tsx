import { EchoThread } from "@/components/echo-thread";

interface EchoPageProps {
  params: {
    id: string;
  };
}

export default function EchoPage({ params }: EchoPageProps) {
  return <EchoThread secretId={params.id} />;
}
