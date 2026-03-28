import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPV Dashboard",
  description: "FPV Drone Configuration Dashboard — Auto-detect, configure & fly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen">
        <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-bold text-sm">
              FPV
            </div>
            <span className="text-lg font-bold tracking-tight">
              FPV Dashboard
            </span>
            <span className="text-xs text-foreground/40 ml-2">ELRS</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-foreground/60">
            <span>RadioMaster TX16S</span>
            <span className="text-foreground/20">|</span>
            <span>RadioMaster Pocket</span>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
