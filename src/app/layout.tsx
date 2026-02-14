import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { VisitTracker } from "@/components/visit-tracker";
import { BottomNav } from "@/components/bottom-nav";
import { VoidIntro } from "@/components/void-intro";
import { VoidCursor } from "@/components/void-cursor";
import { VoidReveal } from "@/components/void-reveal";
import { VoidBackdrop } from "@/components/void-backdrop";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="void-layout">
        <VisitTracker />
        <VoidBackdrop />
        <VoidIntro />
        <VoidReveal />
        <VoidCursor />
        <div className="void-shell">
          <header className="void-container">
            <Navigation />
          </header>
          <main className="mt-4">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
