import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "RestaurantAI | Premium-Websites für Restaurants",
  description: "Premium-Websites, Online-Speisekarten, Bestellungen, Reservierungen und KI-gestützte Gastkommunikation für Restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
