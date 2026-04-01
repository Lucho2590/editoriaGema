"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Book, BookFormat } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { toggleBookPublished, toggleBookFeatured } from "@/server/actions/books";
import { Plus, Edit, Eye, EyeOff, Star, StarOff } from "lucide-react";

export default function AdminLibrosPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormats, setSelectedFormats] = useState<Record<string, BookFormat>>({});

  useEffect(() => {
    async function loadBooks() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "books"), orderBy("createdAt", "desc"))
        );
        const booksData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        }) as Book[];
        setBooks(booksData);

        // Initialize selected formats to first available format
        const formats: Record<string, BookFormat> = {};
        booksData.forEach((book) => {
          if (book.formats.pdf) formats[book.id] = "pdf";
          else if (book.formats.epub) formats[book.id] = "epub";
          else if (book.formats.print) formats[book.id] = "print";
        });
        setSelectedFormats(formats);
      } catch (error) {
        console.error("Failed to load books:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  const getPrice = (book: Book, format: BookFormat) => {
    switch (format) {
      case "pdf": return book.pricePdf;
      case "epub": return book.priceEpub;
      case "print": return book.pricePrint;
    }
  };

  const handleTogglePublished = async (book: Book) => {
    const result = await toggleBookPublished(book.id, !book.published);
    if (result.success) {
      setBooks(books.map(b =>
        b.id === book.id ? { ...b, published: !b.published } : b
      ));
    }
  };

  const handleToggleFeatured = async (book: Book) => {
    const result = await toggleBookFeatured(book.id, !book.featured);
    if (result.success) {
      setBooks(books.map(b =>
        b.id === book.id ? { ...b, featured: !b.featured } : b
      ));
    }
  };

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
          <Button variant="secondary" size="md">
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
            <Button variant="secondary" size="md">
              Crear primer libro
            </Button>
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
                  Formato / Precio
                </th>
                <th className="text-center py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Destacado
                </th>
                <th className="text-center py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
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
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedFormats[book.id] || "pdf"}
                        onChange={(e) => setSelectedFormats({
                          ...selectedFormats,
                          [book.id]: e.target.value as BookFormat
                        })}
                        className="text-caption bg-gema-gray-100 px-2 py-1 rounded border-0 focus:ring-1 focus:ring-gema-black"
                      >
                        {book.formats.pdf && <option value="pdf">PDF</option>}
                        {book.formats.epub && <option value="epub">EPUB</option>}
                        {book.formats.print && (
                          <option value="print">Impreso ({book.stockPrint})</option>
                        )}
                      </select>
                      <span className="text-small font-medium text-gema-black">
                        {formatCurrency(getPrice(book, selectedFormats[book.id] || "pdf"))}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleToggleFeatured(book)}
                      className="p-2 hover:bg-gema-gray-100 rounded transition-colors"
                      title={book.featured ? "Quitar de destacados" : "Marcar como destacado"}
                    >
                      {book.featured ? (
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff size={18} className="text-gema-gray-300" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleTogglePublished(book)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                        book.published
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-gema-gray-100 text-gema-gray-500 hover:bg-gema-gray-200"
                      }`}
                    >
                      {book.published ? (
                        <>
                          <Eye size={14} />
                          <span className="text-caption">Publicado</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          <span className="text-caption">Borrador</span>
                        </>
                      )}
                    </button>
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
