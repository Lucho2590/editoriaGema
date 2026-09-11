import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Fraunces en lugar de Playfair: Playfair es la serif por defecto de medio
// internet (la usa también Sofía Casa, una de las referencias). Fraunces es
// variable, tiene más voz editorial y se banca tamaños grandes sin verse
// genérica. Las itálicas se usan en nombres de autor y pullquotes.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    // Las variables se declaran acá pero no se aplica font-family global:
    // el sitio público la toma en (public)/layout.tsx y /admin se queda con
    // el stack del sistema que viene usando.
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
