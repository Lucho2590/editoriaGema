"use client";

import { useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { Crop, Eye, Loader2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { getCoverImageForEditing } from "@/server/actions/books";

/**
 * Covers use the 7:10 proportion of GEMA's printed books (14 × 20 cm). The
 * public site renders every cover in a 7:10 box with object-cover (BookCard,
 * BookDetail, home "Destacado"), so what the admin frames here is exactly what
 * gets published.
 */
const COVER_ASPECT = 7 / 10;
const OUTPUT_WIDTH = 1600;
const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / COVER_ASPECT);
const JPEG_QUALITY = 0.95;

const BACKGROUNDS = [
  { label: "Blanco", value: "#ffffff" },
  { label: "Papel", value: "#fbfaf6" },
  { label: "Negro", value: "#171310" },
];

interface CoverImageFieldProps {
  preview: string | null;
  /** Uncropped image to re-frame from; falls back to `preview` */
  source?: string | null;
  /**
   * `original` is the newly picked file, or null when an existing image was
   * re-framed (its original is already stored).
   */
  onChange: (file: File, previewUrl: string, original: File | null) => void;
  /** Shown as an X over the cover (remove, or revert to the saved cover) */
  onClear?: () => void;
  title?: string;
  author?: string;
}

export function CoverImageField({
  preview,
  source,
  onChange,
  onClear,
  title,
  author,
}: CoverImageFieldProps) {
  // Image being framed in the cropper, plus the picked file when it's a new upload
  const [editing, setEditing] = useState<{ src: string; original: File | null } | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow picking the same file again after cancelling
    e.target.value = "";
    if (file) setEditing({ src: URL.createObjectURL(file), original: file });
  };

  const handleReframe = async () => {
    const url = source || preview;
    if (!url) return;
    setSourceError(null);
    // Local files can be drawn directly; stored ones must go through the server
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      setEditing({ src: url, original: null });
      return;
    }
    setLoadingSource(true);
    try {
      const res = await getCoverImageForEditing(url);
      if (!res.success || !res.dataUrl) throw new Error(res.error);
      setEditing({ src: res.dataUrl, original: null });
    } catch (err) {
      setSourceError(err instanceof Error && err.message ? err.message : "No se pudo abrir la imagen");
    } finally {
      setLoadingSource(false);
    }
  };

  const closeEditor = () => {
    // Only revoke URLs created here for a new upload; `source` blobs belong to the page
    if (editing?.original) URL.revokeObjectURL(editing.src);
    setEditing(null);
  };

  const fileInput = (
    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
  );

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-40 aspect-[7/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 p-1 bg-gema-black text-gema-white rounded-full"
              aria-label="Quitar imagen"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-40 aspect-[7/10] border-2 border-dashed border-gema-gray-200 cursor-pointer hover:border-gema-gray-400 transition-colors">
          <Upload className="w-8 h-8 text-gema-gray-400 mb-2" />
          <span className="text-caption text-gema-gray-400">Subir imagen</span>
          {fileInput}
        </label>
      )}

      {preview && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={handleReframe}
            disabled={loadingSource}
            className="inline-flex items-center gap-2 text-small text-gema-gray-600 hover:text-gema-black disabled:opacity-50"
          >
            {loadingSource ? <Loader2 size={16} className="animate-spin" /> : <Crop size={16} />}
            Ajustar encuadre
          </button>
          <label className="inline-flex items-center gap-2 text-small text-gema-gray-600 cursor-pointer hover:text-gema-black">
            <Upload size={16} />
            Cambiar imagen
            {fileInput}
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 text-small text-gema-gray-600 hover:text-gema-black"
          >
            <Eye size={16} />
            Vista previa
          </button>
        </div>
      )}

      {sourceError && <p className="text-small text-red-600">{sourceError}</p>}

      <p className="text-caption text-gema-gray-400">
        Formato 7:10 (libro de 14 × 20 cm), se exporta a 1600 × 2286 px. Para mejor
        calidad, subí la imagen original de al menos 1600 px de ancho.
      </p>

      {editing && (
        <CoverCropModal
          source={editing.src}
          onCancel={closeEditor}
          onDone={(file) => {
            const original = editing.original;
            closeEditor();
            onChange(file, URL.createObjectURL(file), original);
          }}
        />
      )}

      {showPreview && preview && (
        <CoverPreviewModal
          src={preview}
          title={title}
          author={author}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function CoverCropModal({
  source,
  onCancel,
  onDone,
}: {
  source: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // Zoom at which the whole image fits inside the frame (nothing cut off)
  const [fitZoom, setFitZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [background, setBackground] = useState(BACKGROUNDS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minZoom = Math.min(fitZoom, 1) * 0.8;

  const handleMediaLoaded = ({ naturalWidth, naturalHeight }: MediaSize) => {
    const ratio = naturalWidth / naturalHeight;
    const fit = Math.min(ratio / COVER_ASPECT, COVER_ASPECT / ratio);
    setFitZoom(fit);
    // Start showing the whole cover; zooming in is the admin's call. When the
    // image is already (almost) 7:10, fill the frame so no hairline bands show.
    setZoom(fit > 0.97 ? 1 : fit);
  };

  const handleApply = async () => {
    if (!area) return;
    setSaving(true);
    setError(null);
    try {
      onDone(await renderCover(source, area, background));
    } catch (err) {
      console.error("Failed to crop cover:", err);
      setError("No se pudo procesar la imagen. Probá con otro archivo.");
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !saving && onCancel()} title="Ajustar portada" size="lg">
      <div className="space-y-5">
        <div className="relative h-[55vh] min-h-[320px]">
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={4}
            zoomSpeed={0.2}
            aspect={COVER_ASPECT}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            onMediaLoaded={handleMediaLoaded}
            style={{ containerStyle: { backgroundColor: background } }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(minZoom, z - 0.1))}
            className="p-1 text-gema-gray-500 hover:text-gema-black"
            aria-label="Alejar"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min={minZoom}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-gema-black"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, z + 0.1))}
            className="p-1 text-gema-gray-500 hover:text-gema-black"
            aria-label="Acercar"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-small">
            <button
              type="button"
              onClick={() => {
                setZoom(fitZoom);
                setCrop({ x: 0, y: 0 });
              }}
              className="text-gema-gray-600 hover:text-gema-black underline-offset-4 hover:underline"
            >
              Encajar entera
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
              className="text-gema-gray-600 hover:text-gema-black underline-offset-4 hover:underline"
            >
              Llenar el marco
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-small text-gema-gray-500">Fondo</span>
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.value}
                type="button"
                title={bg.label}
                aria-label={`Fondo ${bg.label}`}
                onClick={() => setBackground(bg.value)}
                className={cn(
                  "size-6 rounded-full border border-gema-gray-200",
                  background === bg.value && "ring-2 ring-offset-2 ring-gema-black"
                )}
                style={{ backgroundColor: bg.value }}
              />
            ))}
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="size-6 cursor-pointer bg-transparent"
              aria-label="Otro color de fondo"
              title="Otro color"
            />
          </div>
        </div>

        <p className="text-caption text-gema-gray-400">
          Arrastrá para mover la imagen y usá el zoom para ajustarla. Si la alejás,
          el espacio libre se completa con el color de fondo.
        </p>

        {error && <p className="text-small text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={saving} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleApply} loading={saving} disabled={!area} className="flex-1">
            Aplicar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CoverPreviewModal({
  src,
  title,
  author,
  onClose,
}: {
  src: string;
  title?: string;
  author?: string;
  onClose: () => void;
}) {
  const bookTitle = title || "Título del libro";
  const bookAuthor = author || "Autor";

  return (
    <Modal isOpen onClose={onClose} title="Vista previa" size="lg">
      <div className="bg-paper p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-caption uppercase tracking-wider text-gema-gray-500 mb-4">
            Catálogo
          </p>
          {/* Mirrors components/books/BookCard.tsx */}
          <div className="w-44">
            <div className="relative aspect-[7/10] mb-5 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <h3 className="font-display text-h4 text-ink text-balance">{bookTitle}</h3>
            <p className="font-display italic text-meta text-ink-soft mt-1">{bookAuthor}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-caption uppercase tracking-wider text-gema-gray-500 mb-4">
              Ficha del libro
            </p>
            {/* Mirrors components/books/BookDetail.tsx */}
            <div className="relative aspect-[7/10] w-full max-w-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <p className="text-caption uppercase tracking-wider text-gema-gray-500 mb-4">
              Carrito
            </p>
            {/* Mirrors the checkout thumbnail in components/checkout/CheckoutForm.tsx */}
            <div className="relative w-20 aspect-[7/10] bg-paper-warm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Draws the framed area onto a 1600 × 2286 canvas. When zoomed out the area extends
 * past the image, so the canvas is filled with the background first and the
 * image is placed relative to the area (negative offsets are fine).
 */
async function renderCover(source: string, area: Area, background: string): Promise<File> {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = OUTPUT_WIDTH / area.width;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    -area.x * scale,
    -area.y * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Could not encode cover");
  return new File([blob], "cover.jpg", { type: "image/jpeg" });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
