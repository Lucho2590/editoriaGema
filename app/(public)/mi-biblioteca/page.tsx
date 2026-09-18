"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserPurchase } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { trackDownloadStarted } from "@/lib/analytics";

export default function MiBibliotecaPage() {
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLibrary() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const libraryDoc = await getDoc(doc(db, "user_library", user.uid));
        if (libraryDoc.exists()) {
          const data = libraryDoc.data();
          setPurchases(data.purchases || []);
        }
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadLibrary();
    }
  }, [user, authLoading]);

  const handleDownload = (purchase: UserPurchase) => {
    trackDownloadStarted(purchase.bookId, purchase.format);
    if (purchase.downloadUrl) {
      window.open(purchase.downloadUrl, "_blank");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-transition">
        <section className="section min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lede text-ink-soft">Cargando...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-transition">
        <section className="section min-h-[60vh] flex items-center">
          <div className="max-w-readable mx-auto text-center">
            <h1 className="font-display text-h2 text-ink mb-4">
              Mi Biblioteca
            </h1>
            <p className="text-lede text-ink-soft mb-8">
              Inicia sesión para acceder a tus libros digitales.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-8 py-4 bg-ink text-paper text-meta tracking-wide hover:bg-paper-warm transition-colors duration-300"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="page-transition">
        <section className="section min-h-[60vh] flex items-center">
          <div className="max-w-readable mx-auto text-center">
            <h1 className="font-display text-h2 text-ink mb-4">
              Mi Biblioteca
            </h1>
            <p className="text-lede text-ink-soft mb-8">
              Aún no tienes libros digitales. Explora nuestro catálogo para
              encontrar tu próxima lectura.
            </p>
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 bg-ink text-paper text-meta tracking-wide hover:bg-paper-warm transition-colors duration-300"
            >
              Ver catálogo
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-transition">
      {/* Header */}
      <section className="section-sm border-b border-rule">
        <div className="max-w-content mx-auto">
          <h1 className="font-display text-hero text-ink mb-4">
            Mi Biblioteca
          </h1>
          <p className="text-lede text-ink-soft">
            Tus libros digitales comprados en GEMA.
          </p>
        </div>
      </section>

      {/* Library Grid */}
      <section className="section">
        <div className="max-w-content mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchases.map((purchase, index) => (
              <div
                key={`${purchase.orderId}-${purchase.bookId}-${purchase.format}`}
                className="group animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-paper-warm p-6">
                  {/* Cover */}
                  <div className="relative aspect-[7/10] mb-6 bg-paper">
                    {purchase.bookCover && (
                      <Image
                        src={purchase.bookCover}
                        alt={purchase.bookTitle}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-6">
                    <h3 className="font-display text-h4 text-ink">
                      {purchase.bookTitle}
                    </h3>
                    <p className="text-meta text-ink-soft">
                      {purchase.bookAuthor}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-meta uppercase tracking-wider text-ink-soft">
                        {purchase.format}
                      </span>
                      <span className="text-meta text-ink-soft/60">·</span>
                      <span className="text-meta text-ink-soft">
                        {formatDate(purchase.purchasedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Download Button */}
                  {purchase.downloadUrl && (
                    <Button
                      onClick={() => handleDownload(purchase)}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar {purchase.format.toUpperCase()}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
