import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { VisitTracker } from "@/components/visit-tracker";

export const metadata: Metadata = {
  title: "VOID",
  description: "Un reseau social fantome."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="void-layout">
        <VisitTracker />
        <div className="void-shell mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <header>
            <Navigation />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
