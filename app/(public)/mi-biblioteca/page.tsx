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
            <p className="text-body text-gema-gray-500">Cargando...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-transition">
        <section className="section min-h-[60vh] flex items-center">
          <div className="max-w-prose mx-auto text-center">
            <h1 className="font-serif text-heading-xl text-gema-black mb-4">
              Mi Biblioteca
            </h1>
            <p className="text-body-lg text-gema-gray-600 mb-8">
              Inicia sesión para acceder a tus libros digitales.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-8 py-4 bg-gema-black text-gema-white text-small tracking-wide hover:bg-gema-gray-800 transition-colors duration-300"
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
          <div className="max-w-prose mx-auto text-center">
            <h1 className="font-serif text-heading-xl text-gema-black mb-4">
              Mi Biblioteca
            </h1>
            <p className="text-body-lg text-gema-gray-600 mb-8">
              Aún no tienes libros digitales. Explora nuestro catálogo para encontrar tu próxima lectura.
            </p>
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 bg-gema-black text-gema-white text-small tracking-wide hover:bg-gema-gray-800 transition-colors duration-300"
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
      <section className="section-sm border-b border-gema-gray-100">
        <div className="max-w-content mx-auto">
          <h1 className="font-serif text-display text-gema-black mb-4">
            Mi Biblioteca
          </h1>
          <p className="text-body-lg text-gema-gray-500">
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
                <div className="bg-gema-gray-50 p-6">
                  {/* Cover */}
                  <div className="relative aspect-[3/4] mb-6 bg-gema-white">
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
                    <h3 className="font-serif text-heading text-gema-black">
                      {purchase.bookTitle}
                    </h3>
                    <p className="text-small text-gema-gray-500">
                      {purchase.bookAuthor}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-caption uppercase tracking-wider text-gema-gray-400">
                        {purchase.format}
                      </span>
                      <span className="text-caption text-gema-gray-300">·</span>
                      <span className="text-caption text-gema-gray-400">
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
