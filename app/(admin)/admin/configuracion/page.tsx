"use client";

import { useEffect, useState, useTransition } from "react";
import { CreditCard, Check, AlertCircle, ExternalLink, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getMercadoPagoSettings,
  saveMercadoPagoCredentials,
  setMercadoPagoActiveMode,
  clearMercadoPagoMode,
  type MercadoPagoSettings,
  type MercadoPagoMode,
} from "@/server/actions/settings";
import { useAuth } from "@/hooks/useAuth";

type StatusMessage = { type: "success" | "error"; text: string };

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MercadoPagoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [, startTransition] = useTransition();
  const [webhookUrl, setWebhookUrl] = useState("");

  const [testToken, setTestToken] = useState("");
  const [testSecret, setTestSecret] = useState("");
  const [savingTest, setSavingTest] = useState(false);

  const [prodToken, setProdToken] = useState("");
  const [prodSecret, setProdSecret] = useState("");
  const [savingProd, setSavingProd] = useState(false);

  const [switchingMode, setSwitchingMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/payment/mercadopago`);
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getMercadoPagoSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (mode: MercadoPagoMode) => {
    const token = mode === "test" ? testToken : prodToken;
    const secret = mode === "test" ? testSecret : prodSecret;
    const setSaving = mode === "test" ? setSavingTest : setSavingProd;

    if (!token || !secret) {
      setStatus({ type: "error", text: "Completá Access Token y Webhook Secret antes de guardar." });
      return;
    }

    setSaving(true);
    try {
      const result = await saveMercadoPagoCredentials({
        mode,
        accessToken: token,
        webhookSecret: secret,
        updatedBy: user?.email || undefined,
      });
      if (result.success) {
        setStatus({
          type: "success",
          text: `Credenciales de ${mode === "test" ? "Pruebas" : "Producción"} guardadas.`,
        });
        if (mode === "test") {
          setTestToken("");
          setTestSecret("");
        } else {
          setProdToken("");
          setProdSecret("");
        }
        await loadSettings();
      } else {
        setStatus({ type: "error", text: result.error || "No se pudo guardar." });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchMode = (mode: MercadoPagoMode) => {
    if (settings?.activeMode === mode) return;
    setSwitchingMode(true);
    startTransition(async () => {
      try {
        const result = await setMercadoPagoActiveMode({
          mode,
          updatedBy: user?.email || undefined,
        });
        if (result.success) {
          setStatus({
            type: "success",
            text: `Modo activo cambiado a ${mode === "test" ? "Pruebas" : "Producción"}.`,
          });
          await loadSettings();
        } else {
          setStatus({ type: "error", text: result.error || "No se pudo cambiar el modo." });
        }
      } finally {
        setSwitchingMode(false);
      }
    });
  };

  const handleClearMode = async (mode: MercadoPagoMode) => {
    const label = mode === "test" ? "Pruebas" : "Producción";
    if (!confirm(`¿Borrar las credenciales de ${label}? Los pagos en este modo van a dejar de funcionar.`)) {
      return;
    }
    const result = await clearMercadoPagoMode({ mode, updatedBy: user?.email || undefined });
    if (result.success) {
      setStatus({ type: "success", text: `Credenciales de ${label} borradas.` });
      await loadSettings();
    } else {
      setStatus({ type: "error", text: result.error || "No se pudo borrar." });
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setStatus({ type: "success", text: "URL copiada al portapapeles." });
    } catch {
      setStatus({ type: "error", text: "No se pudo copiar. Copialá manualmente." });
    }
  };

  const activeMode: MercadoPagoMode = settings?.activeMode || "test";
  const testConfigured = Boolean(settings?.test?.accessToken);
  const prodConfigured = Boolean(settings?.production?.accessToken);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-heading-xl text-gema-black">Configuración</h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Integraciones externas y vinculación de servicios.
        </p>
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

      <section className="bg-white border border-gema-gray-200 rounded-md p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gema-gray-50 rounded-md">
            <CreditCard size={24} className="text-gema-black" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
              <h2 className="font-serif text-heading text-gema-black">MercadoPago</h2>
              {!loading && (
                <span
                  className={`text-caption px-2 py-1 rounded-full ${
                    activeMode === "production" && prodConfigured
                      ? "bg-green-100 text-green-800"
                      : activeMode === "test" && testConfigured
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gema-gray-100 text-gema-gray-500"
                  }`}
                >
                  {activeMode === "production" && prodConfigured
                    ? "Activo en Producción"
                    : activeMode === "test" && testConfigured
                    ? "Activo en Pruebas"
                    : "Sin configurar"}
                </span>
              )}
            </div>

            <p className="text-body text-gema-gray-500 mb-6">
              Pegá las credenciales que sacaste del{" "}
              <a
                href="https://www.mercadopago.com.ar/developers/panel"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gema-black"
              >
                panel de desarrolladores de MP
              </a>
              . Guardá las dos para poder alternar entre pruebas y cobros reales sin perder credenciales.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-gema-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-small">Cargando...</span>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-3">
                    Modo activo
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("test")}
                      disabled={switchingMode || !testConfigured}
                      className={`flex-1 px-4 py-3 border text-small transition-colors ${
                        activeMode === "test"
                          ? "bg-gema-black text-gema-white border-gema-black"
                          : "border-gema-gray-200 text-gema-black hover:border-gema-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gema-gray-200"
                      }`}
                    >
                      Pruebas {testConfigured ? "" : "(falta configurar)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("production")}
                      disabled={switchingMode || !prodConfigured}
                      className={`flex-1 px-4 py-3 border text-small transition-colors ${
                        activeMode === "production"
                          ? "bg-gema-black text-gema-white border-gema-black"
                          : "border-gema-gray-200 text-gema-black hover:border-gema-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gema-gray-200"
                      }`}
                    >
                      Producción {prodConfigured ? "" : "(falta configurar)"}
                    </button>
                  </div>
                </div>

                <CredentialsCard
                  mode="test"
                  title="Credenciales de Pruebas"
                  hint='Copialas de la sección "Credenciales de prueba" del panel de MP.'
                  configured={testConfigured}
                  maskedToken={settings?.test?.accessToken}
                  maskedSecret={settings?.test?.webhookSecret}
                  tokenValue={testToken}
                  secretValue={testSecret}
                  onTokenChange={setTestToken}
                  onSecretChange={setTestSecret}
                  saving={savingTest}
                  onSave={() => handleSaveCredentials("test")}
                  onClear={() => handleClearMode("test")}
                />

                <CredentialsCard
                  mode="production"
                  title="Credenciales de Producción"
                  hint='Copialas de la sección "Credenciales de producción" del panel de MP.'
                  configured={prodConfigured}
                  maskedToken={settings?.production?.accessToken}
                  maskedSecret={settings?.production?.webhookSecret}
                  tokenValue={prodToken}
                  secretValue={prodSecret}
                  onTokenChange={setProdToken}
                  onSecretChange={setProdSecret}
                  saving={savingProd}
                  onSave={() => handleSaveCredentials("production")}
                  onClear={() => handleClearMode("production")}
                />

                <div>
                  <h3 className="text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-3">
                    URL del webhook
                  </h3>
                  <p className="text-small text-gema-gray-500 mb-3">
                    En el panel de MP → Webhooks, agregá esta URL y marcá el evento{" "}
                    <code className="px-1 py-0.5 bg-gema-gray-100 rounded text-caption">payment</code>.
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-4 py-3 bg-gema-gray-50 text-small text-gema-black border border-gema-gray-200 overflow-x-auto">
                      {webhookUrl || "(cargando...)"}
                    </code>
                    <Button variant="secondary" onClick={copyWebhookUrl} size="md">
                      <Copy size={14} />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 bg-white border border-gema-gray-200 rounded-md p-6">
        <h3 className="font-serif text-heading text-gema-black mb-2">Enlaces útiles</h3>
        <p className="text-body text-gema-gray-500 mb-4">
          Paneles externos relacionados con la operación.
        </p>
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
            href="https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/test-cards"
            label="Tarjetas de prueba (sandbox)"
          />
        </div>
      </section>
    </div>
  );
}

interface CredentialsCardProps {
  mode: MercadoPagoMode;
  title: string;
  hint: string;
  configured: boolean;
  maskedToken?: string;
  maskedSecret?: string;
  tokenValue: string;
  secretValue: string;
  onTokenChange: (v: string) => void;
  onSecretChange: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onClear: () => void;
}

function CredentialsCard(props: CredentialsCardProps) {
  return (
    <div className="border border-gema-gray-200 rounded-md p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-body text-gema-black">{props.title}</h3>
        <span
          className={`text-caption px-2 py-1 rounded-full ${
            props.configured ? "bg-green-100 text-green-800" : "bg-gema-gray-100 text-gema-gray-500"
          }`}
        >
          {props.configured ? "Configurado" : "Sin configurar"}
        </span>
      </div>
      <p className="text-caption text-gema-gray-500 mb-4">{props.hint}</p>

      {props.configured && (
        <dl className="space-y-3 mb-4 p-3 bg-gema-gray-50 rounded">
          <div className="min-w-0">
            <dt className="text-caption uppercase tracking-wider text-gema-gray-500">Access Token actual</dt>
            <dd className="text-small text-gema-black mt-1 font-mono truncate" title={props.maskedToken}>
              {props.maskedToken}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-caption uppercase tracking-wider text-gema-gray-500">Webhook Secret actual</dt>
            <dd className="text-small text-gema-black mt-1 font-mono truncate" title={props.maskedSecret}>
              {props.maskedSecret}
            </dd>
          </div>
        </dl>
      )}

      <div className="space-y-4">
        <Input
          label="Access Token"
          type="password"
          autoComplete="off"
          placeholder="APP_USR-..."
          value={props.tokenValue}
          onChange={(e) => props.onTokenChange(e.target.value)}
        />
        <Input
          label="Webhook Secret"
          type="password"
          autoComplete="off"
          placeholder="Pegá la clave secreta del webhook de MP"
          value={props.secretValue}
          onChange={(e) => props.onSecretChange(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={props.onSave} loading={props.saving}>
            {props.configured ? "Actualizar" : "Guardar"}
          </Button>
          {props.configured && (
            <Button variant="secondary" onClick={props.onClear}>
              Borrar
            </Button>
          )}
        </div>
      </div>
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
