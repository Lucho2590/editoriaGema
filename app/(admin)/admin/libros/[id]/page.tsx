"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { getBookById, updateBook, deleteBook } from "@/server/actions/books";
import { Book, BookInput } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditarLibroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<Partial<BookInput>>({
    title: "",
    author: "",
    description: "",
    year: new Date().getFullYear(),
    formats: { pdf: false, epub: false, print: false },
    pricePdf: 0,
    priceEpub: 0,
    pricePrint: 0,
    stockPrint: 0,
    featured: false,
    published: false,
  });

  const [originalBook, setOriginalBook] = useState<Book | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadBook() {
      try {
        const book = await getBookById(id);
        if (!book) {
          router.push("/admin/libros");
          return;
        }
        setOriginalBook(book);
        setFormData({
          title: book.title,
          slug: book.slug,
          author: book.author,
          description: book.description,
          year: book.year,
          formats: book.formats,
          pricePdf: book.pricePdf,
          priceEpub: book.priceEpub,
          pricePrint: book.pricePrint,
          stockPrint: book.stockPrint,
          featured: book.featured,
          published: book.published,
          coverImage: book.coverImage,
          pdfFileUrl: book.pdfFileUrl,
          epubFileUrl: book.epubFileUrl,
        });
        setCoverPreview(book.coverImage);
      } catch (error) {
        console.error("Failed to load book:", error);
        setError("Error al cargar el libro");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [id, router]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.title || !formData.author) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      let coverImage = formData.coverImage;
      let pdfFileUrl = formData.pdfFileUrl;
      let epubFileUrl = formData.epubFileUrl;

      // Upload new cover if changed
      if (coverFile) {
        const coverRef = ref(storage, `covers/${formData.slug}-${Date.now()}`);
        await uploadBytes(coverRef, coverFile);
        coverImage = await getDownloadURL(coverRef);
      }

      // Upload new PDF if provided
      if (pdfFile && formData.formats?.pdf) {
        const pdfRef = ref(storage, `books/${formData.slug}/book.pdf`);
        await uploadBytes(pdfRef, pdfFile);
        pdfFileUrl = await getDownloadURL(pdfRef);
      }

      // Upload new EPUB if provided
      if (epubFile && formData.formats?.epub) {
        const epubRef = ref(storage, `books/${formData.slug}/book.epub`);
        await uploadBytes(epubRef, epubFile);
        epubFileUrl = await getDownloadURL(epubRef);
      }

      const result = await updateBook(id, {
        ...formData,
        coverImage,
        pdfFileUrl,
        epubFileUrl,
      } as BookInput);

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar el libro");
      }

      router.push("/admin/libros");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el libro");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const result = await deleteBook(id);
      if (!result.success) {
        throw new Error(result.error || "Error al eliminar el libro");
      }
      router.push("/admin/libros");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el libro");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-body text-gema-gray-500">Cargando libro...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/libros"
          className="inline-flex items-center gap-2 text-small text-gema-gray-500 hover:text-gema-black transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Volver a libros
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-heading-xl text-gema-black">Editar libro</h1>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gema-black/50">
          <div className="bg-white p-8 max-w-md w-full mx-4">
            <h2 className="font-serif text-heading text-gema-black mb-4">
              ¿Eliminar libro?
            </h2>
            <p className="text-body text-gema-gray-600 mb-6">
              Esta acción no se puede deshacer. El libro "{originalBook?.title}" será eliminado permanentemente.
            </p>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={deleting}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gema-gray-100 p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="font-serif text-heading text-gema-black">
              Información básica
            </h2>

            <Input
              label="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              label="Autor"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />

            <div>
              <label className="block text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-transparent border border-gema-gray-200 text-body text-gema-black placeholder:text-gema-gray-400 focus:outline-none focus:border-gema-black transition-colors duration-300 resize-none"
                required
              />
            </div>

            <Input
              label="Año de publicación"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-4">
            <h2 className="font-serif text-heading text-gema-black">Portada</h2>

            {coverPreview ? (
              <div className="relative w-40 h-56">
                <Image
                  src={coverPreview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(originalBook?.coverImage || null);
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-gema-black text-gema-white rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-56 border-2 border-dashed border-gema-gray-200 cursor-pointer hover:border-gema-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gema-gray-400 mb-2" />
                <span className="text-caption text-gema-gray-400">Subir imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}

            {coverPreview && !coverFile && (
              <label className="inline-flex items-center gap-2 text-small text-gema-gray-600 cursor-pointer hover:text-gema-black">
                <Upload size={16} />
                Cambiar imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Formats & Pricing */}
          <div className="space-y-6">
            <h2 className="font-serif text-heading text-gema-black">
              Formatos y precios
            </h2>

            {/* PDF */}
            <div className="flex items-start gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.formats?.pdf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      formats: { ...formData.formats!, pdf: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-body">PDF</span>
              </label>
              {formData.formats?.pdf && (
                <div className="flex-1 space-y-3">
                  <Input
                    label="Precio PDF (ARS)"
                    type="number"
                    value={formData.pricePdf}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePdf: parseInt(e.target.value) || 0 })
                    }
                  />
                  <label className="flex items-center gap-2 text-small text-gema-gray-600 cursor-pointer">
                    <Upload size={16} />
                    {pdfFile ? pdfFile.name : formData.pdfFileUrl ? "Archivo cargado ✓ (click para cambiar)" : "Subir archivo PDF"}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* EPUB */}
            <div className="flex items-start gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.formats?.epub}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      formats: { ...formData.formats!, epub: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-body">EPUB</span>
              </label>
              {formData.formats?.epub && (
                <div className="flex-1 space-y-3">
                  <Input
                    label="Precio EPUB (ARS)"
                    type="number"
                    value={formData.priceEpub}
                    onChange={(e) =>
                      setFormData({ ...formData, priceEpub: parseInt(e.target.value) || 0 })
                    }
                  />
                  <label className="flex items-center gap-2 text-small text-gema-gray-600 cursor-pointer">
                    <Upload size={16} />
                    {epubFile ? epubFile.name : formData.epubFileUrl ? "Archivo cargado ✓ (click para cambiar)" : "Subir archivo EPUB"}
                    <input
                      type="file"
                      accept=".epub,application/epub+zip"
                      onChange={(e) => setEpubFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Print */}
            <div className="flex items-start gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.formats?.print}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      formats: { ...formData.formats!, print: e.target.checked },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-body">Impreso</span>
              </label>
              {formData.formats?.print && (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <Input
                    label="Precio impreso (ARS)"
                    type="number"
                    value={formData.pricePrint}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePrint: parseInt(e.target.value) || 0 })
                    }
                  />
                  <Input
                    label="Stock"
                    type="number"
                    value={formData.stockPrint}
                    onChange={(e) =>
                      setFormData({ ...formData, stockPrint: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Publishing Options */}
          <div className="space-y-4">
            <h2 className="font-serif text-heading text-gema-black">Opciones</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-body">Destacar en la página principal</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-body">Publicado</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-small text-red-500">{error}</p>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" loading={saving}>
              Guardar cambios
            </Button>
            <Link href="/admin/libros">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
