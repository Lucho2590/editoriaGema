import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  authors: [{ name: "GEMA Editorial" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "GEMA Editorial",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
