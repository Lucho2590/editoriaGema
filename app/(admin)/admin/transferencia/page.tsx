"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Loader2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getTransferSettings,
  saveTransferSettings,
  type TransferSettings,
} from "@/server/actions/settings";
import { useAuth } from "@/hooks/useAuth";

type StatusMessage = { type: "success" | "error"; text: string };

export default function TransferenciaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [settings, setSettings] = useState<TransferSettings | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [cbu, setCbu] = useState("");
  const [alias, setAlias] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("0");
  const [contactEmail, setContactEmail] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getTransferSettings();
      setSettings(data);
      if (data) {
        setEnabled(data.enabled);
        setBankName(data.bankName);
        setAccountHolder(data.accountHolder);
        setCuitCuil(data.cuitCuil);
        setCbu(data.cbu);
        setAlias(data.alias);
        setDiscountPercentage(String(data.discountPercentage));
        setContactEmail(data.contactEmail);
        setInstructions(data.instructions);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const result = await saveTransferSettings({
        enabled,
        bankName,
        accountHolder,
        cuitCuil,
        cbu,
        alias,
        discountPercentage: Number(discountPercentage),
        contactEmail,
        instructions,
        updatedBy: user?.email || undefined,
      });
      if (result.success) {
        setStatus({ type: "success", text: "Configuración guardada." });
        await loadSettings();
      } else {
        setStatus({ type: "error", text: result.error || "No se pudo guardar." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gema-gray-100 flex items-center justify-center shrink-0">
          <Landmark size={22} className="text-gema-black" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-heading-xl text-gema-black">Transferencia bancaria</h1>
            {!loading && (
              <span
                className={`text-caption px-2 py-1 rounded-full ${
                  settings?.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gema-gray-100 text-gema-gray-500"
                }`}
              >
                {settings?.enabled ? "Habilitada" : "Deshabilitada"}
              </span>
            )}
          </div>
          <p className="text-body text-gema-gray-500 mt-2">
            Datos bancarios y descuento que ven los clientes que eligen pagar por transferencia.
          </p>
        </div>
      </div>

      {status && (
        <div
          className={`mb-6 p-4 rounded-md flex items-start gap-3 ${
            status.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {status.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <p className="text-small">{status.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gema-gray-500 p-6 bg-white border border-gema-gray-200 rounded-md">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-small">Cargando...</span>
        </div>
      ) : (
        <section className="bg-white border border-gema-gray-200 rounded-md p-6 space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-body text-gema-black">
              Habilitar transferencia como método de pago en el checkout
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              placeholder="Ej. Banco Galicia"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <Input
              label="Titular de la cuenta"
              placeholder="Razón social o nombre completo"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CUIT / CUIL"
              placeholder="30-12345678-9"
              value={cuitCuil}
              onChange={(e) => setCuitCuil(e.target.value)}
            />
            <Input
              label="Email de contacto"
              type="email"
              placeholder="pagos@editorial.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CBU"
              placeholder="0000000000000000000000"
              value={cbu}
              onChange={(e) => setCbu(e.target.value)}
            />
            <Input
              label="Alias"
              placeholder="gema.editorial"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </div>

          <Input
            label="Descuento por transferencia (%)"
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(e.target.value)}
          />

          <div className="w-full">
            <label className="block text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-2">
              Instrucciones para el comprador
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Texto que verá el comprador junto a los datos bancarios."
              className="flex w-full border border-gema-gray-200 bg-transparent px-4 py-3 text-body text-gema-black placeholder:text-gema-gray-400 focus:outline-none focus:border-gema-black focus:ring-1 focus:ring-gema-black/10 transition-colors duration-300"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} loading={saving}>
              Guardar
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
