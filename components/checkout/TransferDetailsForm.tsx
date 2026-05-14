"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitTransferDetails } from "@/server/actions/orders";

interface Props {
  orderId: string;
}

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  return "bin";
}

export function TransferDetailsForm({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerDni, setBuyerDni] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerBank, setBuyerBank] = useState("");
  const [buyerAccount, setBuyerAccount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!buyerName.trim() || !buyerDni.trim() || !buyerPhone.trim() || !buyerBank.trim() || !buyerAccount.trim()) {
      setError("Completá todos los campos");
      return;
    }

    if (file && file.size > MAX_FILE_BYTES) {
      setError("El comprobante no puede superar 6 MB");
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof submitTransferDetails>[1] = {
        buyerName,
        buyerDni,
        buyerPhone,
        buyerBank,
        buyerAccount,
      };

      if (file) {
        const base64 = await fileToBase64(file);
        payload.receipt = {
          base64,
          contentType: file.type || "application/octet-stream",
          extension: extensionFromFile(file),
        };
      }

      const result = await submitTransferDetails(orderId, payload);
      if (!result.success) {
        throw new Error(result.error || "No se pudieron enviar los datos");
      }

      router.push(`/checkout/pending?external_reference=${orderId}&method=transfer`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar los datos");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre completo"
        value={buyerName}
        onChange={(e) => setBuyerName(e.target.value)}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="DNI"
          value={buyerDni}
          onChange={(e) => setBuyerDni(e.target.value)}
          inputMode="numeric"
          required
        />
        <Input
          label="Teléfono"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
          inputMode="tel"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Banco de origen"
          placeholder="Ej. Galicia, Santander..."
          value={buyerBank}
          onChange={(e) => setBuyerBank(e.target.value)}
          required
        />
        <Input
          label="Número o alias de tu cuenta"
          value={buyerAccount}
          onChange={(e) => setBuyerAccount(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-2">
          Comprobante (opcional)
        </label>
        <label className="flex items-center gap-3 p-4 border border-dashed border-gema-gray-300 cursor-pointer hover:border-gema-black transition-colors">
          <UploadCloud size={20} className="text-gema-gray-500 shrink-0" />
          <span className="text-small text-gema-gray-600 truncate">
            {file ? file.name : "Subí una imagen o PDF (máx. 6 MB)"}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {error && <p className="text-small text-red-500">{error}</p>}

      <Button type="submit" loading={loading} className="w-full md:w-auto">
        Enviar datos
      </Button>
    </form>
  );
}
