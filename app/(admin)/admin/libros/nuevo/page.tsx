"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { createBook } from "@/server/actions/books";
import { BookInput } from "@/types";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { CoverImageField } from "@/components/admin/CoverImageField";

export default function NuevoLibroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverSourceFile, setCoverSourceFile] = useState<File | null>(null);
  const [coverSourcePreview, setCoverSourcePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.author || !coverFile) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      // Generate slug
      const slug = slugify(formData.title);

      // Upload cover image
      const coverRef = ref(storage, `covers/${slug}-${Date.now()}`);
      await uploadBytes(coverRef, coverFile);
      const coverImage = await getDownloadURL(coverRef);

      // Keep the uncropped original so the cover can be re-framed later
      let coverSourceImage: string | undefined;
      if (coverSourceFile) {
        const sourceRef = ref(storage, `covers/${slug}-original-${Date.now()}`);
        await uploadBytes(sourceRef, coverSourceFile);
        coverSourceImage = await getDownloadURL(sourceRef);
      }

      // Upload PDF if provided
      let pdfFileUrl: string | undefined;
      if (pdfFile && formData.formats?.pdf) {
        const pdfRef = ref(storage, `books/${slug}/book.pdf`);
        await uploadBytes(pdfRef, pdfFile);
        pdfFileUrl = await getDownloadURL(pdfRef);
      }

      // Upload EPUB if provided
      let epubFileUrl: string | undefined;
      if (epubFile && formData.formats?.epub) {
        const epubRef = ref(storage, `books/${slug}/book.epub`);
        await uploadBytes(epubRef, epubFile);
        epubFileUrl = await getDownloadURL(epubRef);
      }

      // Create book
      const result = await createBook({
        ...formData,
        slug,
        coverImage,
        coverSourceImage,
        pdfFileUrl,
        epubFileUrl,
      } as BookInput);

      if (!result.success) {
        throw new Error(result.error || "Error al crear el libro");
      }

      router.push("/admin/libros");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el libro");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="font-serif text-heading-xl text-gema-black">Nuevo libro</h1>
      </div>

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

            <CoverImageField
              preview={coverPreview}
              source={coverSourcePreview}
              onChange={(file, previewUrl, original) => {
                setCoverFile(file);
                setCoverPreview(previewUrl);
                if (original) {
                  setCoverSourceFile(original);
                  setCoverSourcePreview(URL.createObjectURL(original));
                }
              }}
              onClear={() => {
                setCoverFile(null);
                setCoverPreview(null);
                setCoverSourceFile(null);
                setCoverSourcePreview(null);
              }}
              title={formData.title}
              author={formData.author}
            />
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
                    {pdfFile ? pdfFile.name : "Subir archivo PDF"}
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
                    {epubFile ? epubFile.name : "Subir archivo EPUB"}
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
              <span className="text-body">Publicar inmediatamente</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-small text-red-500">{error}</p>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" loading={loading}>
              Crear libro
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
