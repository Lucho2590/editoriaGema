"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Check, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getMercadoPagoSettings, type MercadoPagoSettings } from "@/server/actions/settings";

export default function ConfiguracionPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<MercadoPagoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");

    if (status === "connected") {
      setStatusMessage({ type: "success", text: "Cuenta de MercadoPago conectada correctamente." });
    } else if (status === "error") {
      setStatusMessage({ type: "error", text: `Error al conectar: ${reason || "desconocido"}` });
    }

    loadSettings();
  }, [searchParams]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getMercadoPagoSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/auth/mercadopago/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Seguro querés desconectar la cuenta de MercadoPago? Los pagos van a dejar de funcionar hasta que reconectes.")) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch("/api/auth/mercadopago/disconnect", { method: "POST" });
      if (res.ok) {
        setSettings(null);
        setStatusMessage({ type: "success", text: "Cuenta de MercadoPago desconectada." });
      } else {
        setStatusMessage({ type: "error", text: "No se pudo desconectar." });
      }
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-heading-xl text-gema-black">Configuración</h1>
        <p className="text-body text-gema-gray-500 mt-2">Integraciones externas y vinculación de servicios.</p>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-md flex items-start gap-3 ${
            statusMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <p className="text-small">{statusMessage.text}</p>
        </div>
      )}

      <section className="bg-white border border-gema-gray-200 rounded-md p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gema-gray-50 rounded-md">
            <CreditCard size={24} className="text-gema-black" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-heading text-gema-black">MercadoPago</h2>
              {!loading && (
                <span
                  className={`text-caption px-2 py-1 rounded-full ${
                    settings ? "bg-green-100 text-green-800" : "bg-gema-gray-100 text-gema-gray-500"
                  }`}
                >
                  {settings ? "Conectada" : "No conectada"}
                </span>
              )}
            </div>

            <p className="text-body text-gema-gray-500 mb-4">
              Vinculá la cuenta de MercadoPago donde se acreditarán los pagos de la tienda y entradas.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-gema-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-small">Cargando...</span>
              </div>
            ) : settings ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-4 p-4 bg-gema-gray-50 rounded-md">
                  <div>
                    <dt className="text-caption text-gema-gray-500 uppercase tracking-wider">User ID</dt>
                    <dd className="text-small text-gema-black mt-1">{settings.userId}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-gema-gray-500 uppercase tracking-wider">Modo</dt>
                    <dd className="text-small text-gema-black mt-1">{settings.liveMode ? "Producción" : "Prueba"}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-gema-gray-500 uppercase tracking-wider">Conectada</dt>
                    <dd className="text-small text-gema-black mt-1">
                      {new Date(settings.connectedAt).toLocaleDateString("es-AR")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-caption text-gema-gray-500 uppercase tracking-wider">Token expira</dt>
                    <dd className="text-small text-gema-black mt-1">
                      {new Date(settings.expiresAt).toLocaleDateString("es-AR")}
                    </dd>
                  </div>
                </dl>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleConnect}>
                    Reconectar
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    loading={disconnecting}
                    className="!bg-red-600 hover:!bg-red-700"
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={handleConnect}>
                  Conectar MercadoPago
                </Button>
                <p className="text-caption text-gema-gray-500">
                  Vas a ser redirigido a MercadoPago para autorizar el acceso a tu cuenta.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 bg-white border border-gema-gray-200 rounded-md p-6">
        <h3 className="font-serif text-heading text-gema-black mb-2">Enlaces útiles</h3>
        <p className="text-body text-gema-gray-500 mb-4">Paneles externos relacionados con la operación.</p>
        <div className="space-y-2">
          <ExternalLinkRow
            href="https://www.mercadopago.com.ar/developers/panel"
            label="Panel de desarrolladores de MercadoPago"
          />
          <ExternalLinkRow
            href="https://www.mercadopago.com.ar/activities"
            label="Movimientos y devoluciones"
          />
          <ExternalLinkRow
            href="https://resend.com/emails"
            label="Resend (emails enviados)"
          />
        </div>
      </section>
    </div>
  );
}

function ExternalLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-md hover:bg-gema-gray-50 transition-colors group"
    >
      <span className="text-small text-gema-black">{label}</span>
      <ExternalLink size={14} className="text-gema-gray-400 group-hover:text-gema-black" />
    </a>
  );
}
