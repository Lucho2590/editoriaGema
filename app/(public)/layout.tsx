import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Único punto donde se encienden la paleta y la tipografía del sitio
    // público. /admin no pasa por acá.
    <div className="theme-editorial flex-1 flex flex-col font-ui bg-paper text-ink">
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
