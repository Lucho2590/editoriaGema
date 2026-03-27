"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";

export default function AdminLibrosPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "books"), orderBy("createdAt", "desc"))
        );
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Book[];
        setBooks(booksData);
      } catch (error) {
        console.error("Failed to load books:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-body text-gema-gray-500">Cargando libros...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-heading-xl text-gema-black">Libros</h1>
          <p className="text-body text-gema-gray-500 mt-2">
            Gestiona el catálogo de publicaciones.
          </p>
        </div>
        <Link href="/admin/libros/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo libro
          </Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gema-gray-100">
          <p className="text-body text-gema-gray-500 mb-4">
            No hay libros en el catálogo.
          </p>
          <Link href="/admin/libros/nuevo">
            <Button>Crear primer libro</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gema-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gema-gray-100 bg-gema-gray-50">
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Libro
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Autor
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Formatos
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Precio
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Estado
                </th>
                <th className="text-right py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-gema-gray-50 hover:bg-gema-gray-50/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-14 bg-gema-gray-100 flex-shrink-0">
                        {book.coverImage && (
                          <Image
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-small font-medium text-gema-black">
                          {book.title}
                        </p>
                        <p className="text-caption text-gema-gray-400">
                          {book.year}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {book.author}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      {book.formats.pdf && (
                        <span className="text-caption bg-gema-gray-100 px-2 py-1 rounded">
                          PDF
                        </span>
                      )}
                      {book.formats.epub && (
                        <span className="text-caption bg-gema-gray-100 px-2 py-1 rounded">
                          EPUB
                        </span>
                      )}
                      {book.formats.print && (
                        <span className="text-caption bg-gema-gray-100 px-2 py-1 rounded">
                          Impreso ({book.stockPrint})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-small text-gema-black">
                    {formatCurrency(Math.min(book.pricePdf, book.priceEpub, book.pricePrint))}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {book.published ? (
                        <>
                          <Eye size={14} className="text-green-500" />
                          <span className="text-caption text-green-600">Publicado</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} className="text-gema-gray-400" />
                          <span className="text-caption text-gema-gray-400">Borrador</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/admin/libros/${book.id}`}
                      className="inline-flex items-center gap-1 text-small text-gema-gray-500 hover:text-gema-black transition-colors"
                    >
                      <Edit size={14} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
