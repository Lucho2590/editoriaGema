import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GEMA – Generadora de Escrituras y Manifiestos Artísticos",
    template: "%s | GEMA Editorial",
  },
  description:
    "Editorial independiente de pensamiento contemporáneo, humanidades y ciencias sociales. Libros digitales e impresos.",
  keywords: [
    "editorial",
    "libros",
    "pensamiento contemporáneo",
    "humanidades",
    "ciencias sociales",
    "ebooks",
    "arte",
  ],
  authors: [{ name: "Editorial GEMA" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Editorial GEMA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
