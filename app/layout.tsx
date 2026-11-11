import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_Symbols, Noto_Sans_Symbols_2 } from "next/font/google";
import "./globals.css";
import { StarField } from "@/components/StarField";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const symbols = Noto_Sans_Symbols({ subsets: ["symbols"], variable: "--font-symbols", display: "swap" });
const symbols2 = Noto_Sans_Symbols_2({ subsets: ["symbols"], weight: "400", variable: "--font-symbols2", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lunastrology — Mapa astral e tarot", template: "%s · Lunastrology" },
  description:
    "Calcule seu mapa astral com precisão astronômica e faça tiragens de tarot com interpretação por IA.",
};

export const viewport: Viewport = { themeColor: "#09070F", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} ${symbols.variable} ${symbols2.variable}`}>
      <body>
        <StarField />
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 pt-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
