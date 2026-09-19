"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, Check, Loader2, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  getNotificationSettings,
  saveNotificationSettings,
  sendTestNotification,
  type NotificationSettings,
} from "@/server/actions/settings";
import { emailSchema } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";

type StatusMessage = { type: "success" | "error"; text: string };

export default function NotificacionesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [notifySales, setNotifySales] = useState(true);
  const [notifyTransfers, setNotifyTransfers] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getNotificationSettings();
      setSettings(data);
      if (data) {
        setRecipients(data.recipients);
        setNotifySales(data.notifySales);
        setNotifyTransfers(data.notifyTransfers);
      }
    } finally {
      setLoading(false);
    }
  };

  const isDirty =
    !!settings &&
    (settings.notifySales !== notifySales ||
      settings.notifyTransfers !== notifyTransfers ||
      settings.recipients.join(",") !== recipients.join(","));

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!emailSchema.safeParse(email).success) {
      setEmailError("Ingresá un email válido");
      return;
    }
    if (recipients.includes(email)) {
      setEmailError("Ese email ya está en la lista");
      return;
    }
    setRecipients([...recipients, email]);
    setNewEmail("");
    setEmailError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const result = await saveNotificationSettings({
        recipients,
        notifySales,
        notifyTransfers,
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

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const result = await sendTestNotification();
      setStatus(
        result.success
          ? { type: "success", text: `Aviso de prueba enviado a ${recipients.join(", ")}.` }
          : { type: "error", text: result.error || "No se pudo enviar el aviso de prueba." }
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gema-gray-100 flex items-center justify-center shrink-0">
          <Bell size={22} className="text-gema-black" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-heading-xl text-gema-black">Notificaciones</h1>
          <p className="text-body text-gema-gray-500 mt-2">
            Quién recibe un email cada vez que se vende un libro.
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
        <section className="bg-white border border-gema-gray-200 rounded-md p-6 space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-caption uppercase tracking-[0.1em] text-gema-gray-500">
                Destinatarios
              </h2>
              <p className="text-small text-gema-gray-500 mt-1">
                Pueden ser cualquier dirección, no hace falta que sean administradores.
              </p>
            </div>

            {recipients.length > 0 ? (
              <ul className="border border-gema-gray-100 divide-y divide-gema-gray-100">
                {recipients.map((email) => (
                  <li key={email} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-small text-gema-black truncate">{email}</span>
                    <button
                      type="button"
                      onClick={() => setRecipients(recipients.filter((r) => r !== email))}
                      className="p-1 text-gema-gray-400 hover:text-gema-black"
                      aria-label={`Quitar ${email}`}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-gema-gray-500 border border-dashed border-gema-gray-200 px-4 py-3">
                {settings?.fallbackEmail
                  ? `Todavía no cargaste destinatarios. Mientras tanto, los avisos van a ${settings.fallbackEmail} (variable ADMIN_EMAIL).`
                  : "Todavía no cargaste destinatarios, así que nadie recibe avisos de ventas."}
              </p>
            )}

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="nombre@editorialgema.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  error={emailError ?? undefined}
                />
              </div>
              <Button variant="secondary" onClick={handleAdd} className="h-11">
                <Plus size={16} />
                Agregar
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-caption uppercase tracking-[0.1em] text-gema-gray-500">
              Qué avisar
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={notifySales}
                onCheckedChange={(checked) => setNotifySales(checked === true)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-body text-gema-black">
                  Nueva venta pagada por MercadoPago
                </span>
                <span className="block text-small text-gema-gray-500">
                  Cuando se acredita el pago. No hace falta hacer nada: el comprador ya recibió
                  sus libros.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={notifyTransfers}
                onCheckedChange={(checked) => setNotifyTransfers(checked === true)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-body text-gema-black">
                  Nueva venta por transferencia para verificar
                </span>
                <span className="block text-small text-gema-gray-500">
                  Cuando el comprador sube el comprobante. Hay que verificar que llegó el
                  dinero y aprobarla en Pedidos.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
              Guardar
            </Button>
            <Button
              variant="secondary"
              onClick={handleTest}
              loading={testing}
              disabled={isDirty || recipients.length === 0}
              title={isDirty ? "Guardá los cambios antes de probar" : undefined}
            >
              <Send size={16} />
              Enviar aviso de prueba
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
