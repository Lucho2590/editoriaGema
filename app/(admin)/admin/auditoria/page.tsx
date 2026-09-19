"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  ScrollText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { deleteActivity, getActivity, getActivityCounts } from "@/server/actions/audit";
import {
  ACTIVITY_SOURCES,
  type ActivityRow,
  type ActivitySource,
} from "@/lib/audit/actions";
import { cn, formatCurrency } from "@/lib/utils";

const DETAIL_LABELS: Record<string, string> = {
  items: "Items",
  buyer: "Comprador",
  total: "Total",
  reason: "Motivo",
  to: "Enviado a",
  changedFields: "Campos cambiados",
  mode: "Modo",
  recipients: "Destinatarios",
  notifySales: "Avisar ventas por MercadoPago",
  notifyTransfers: "Avisar transferencias",
  paymentProvider: "Método de pago",
  paymentStatus: "Estado del pago",
  createdAt: "Fecha del pedido",
  enabled: "Habilitada",
  bankName: "Banco",
  accountHolder: "Titular",
  cbu: "CBU",
  alias: "Alias",
  discountPercentage: "Descuento (%)",
  invitationEmailSent: "Email de invitación enviado",
  count: "Cantidad",
  paymentId: "ID de pago",
  processed: "Procesado",
  skipped: "Ignorado",
  error: "Error",
  bookId: "Libro (id)",
  format: "Formato",
  price: "Precio",
  itemCount: "Cantidad de items",
  orderId: "Pedido (id)",
  session: "Sesión",
  userId: "Usuario (id)",
};

const SOURCE_HINTS: Record<ActivitySource, string> = {
  orders:
    "Todas las compras. Al borrar un pedido deja de contar en el Dashboard y en Clientes; si era real, el comprador conserva sus libros.",
  visitors: "Lo que hacen los visitantes en la tienda: agregar al carrito, iniciar la compra, comprar.",
  mercadopago: "Los avisos que MercadoPago le manda a la web sobre cada pago.",
  admin: "Lo que hacen los administradores en el panel.",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if ((key === "total" || key === "price") && typeof value === "number") return formatCurrency(value);
  if (key === "createdAt" && typeof value === "string") return formatDateTime(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const i = item as Record<string, unknown>;
          if ("title" in i) {
            const format = typeof i.format === "string" ? ` (${i.format.toUpperCase()})` : "";
            const price = typeof i.price === "number" ? ` — ${formatCurrency(i.price)}` : "";
            return `${i.title}${format}${price}`;
          }
          return Object.values(i).join(" · ");
        }
        return String(item);
      })
      .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AuditoriaPage() {
  const [source, setSource] = useState<ActivitySource>("orders");
  const [counts, setCounts] = useState<Record<ActivitySource, number> | null>(null);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const loadCounts = useCallback(() => getActivityCounts().then(setCounts), []);

  const loadFirstPage = useCallback(async (tab: ActivitySource) => {
    setLoading(true);
    setError(null);
    const res = await getActivity({ source: tab });
    setRows(res.rows);
    setNextCursor(res.nextCursor);
    if (!res.success) setError(res.error || "No se pudo cargar");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    setChecked(new Set());
    setExpanded(null);
    loadFirstPage(source);
  }, [source, loadFirstPage]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    const res = await getActivity({ source, cursor: nextCursor });
    setRows((prev) => [...prev, ...res.rows]);
    setNextCursor(res.nextCursor);
    if (!res.success) setError(res.error || "No se pudo cargar más");
    setLoadingMore(false);
  };

  const toggle = (path: string, on: boolean) => {
    const next = new Set(checked);
    if (on) next.add(path);
    else next.delete(path);
    setChecked(next);
  };

  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.path));
  const someChecked = rows.some((r) => checked.has(r.path));

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gema-gray-100 flex items-center justify-center shrink-0">
          <ScrollText size={22} className="text-gema-black" />
        </div>
        <div>
          <h1 className="font-serif text-heading-xl text-gema-black">Auditoría</h1>
          <p className="text-body text-gema-gray-500 mt-2">
            Todo lo que registra la web. Marcá lo que quieras y borralo.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-2 flex-wrap">
        {(Object.keys(ACTIVITY_SOURCES) as ActivitySource[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSource(tab)}
            className={cn(
              "text-small px-4 py-2 transition-colors",
              source === tab
                ? "text-gema-black bg-gema-gray-100"
                : "text-gema-gray-500 hover:text-gema-black"
            )}
          >
            {ACTIVITY_SOURCES[tab]}
            {counts && <span className="ml-2 text-gema-gray-400">{counts[tab]}</span>}
          </button>
        ))}
      </div>
      <p className="text-small text-gema-gray-500 mb-6">{SOURCE_HINTS[source]}</p>

      {checked.size > 0 && (
        <div className="flex items-center justify-between gap-4 mb-4 px-6 py-3 bg-gema-black text-gema-white rounded-lg">
          <span className="text-small">
            {checked.size} {checked.size === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setChecked(new Set())}
              className="text-small text-gema-gray-400 hover:text-gema-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 text-small text-red-300 hover:text-red-200"
            >
              <Trash2 size={16} />
              Borrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-md flex items-start gap-3 bg-red-50 text-red-800">
          <AlertCircle size={18} />
          <p className="text-small">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gema-gray-500 p-6 bg-white border border-gema-gray-100 rounded-lg">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-small">Cargando...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gema-gray-100">
          <p className="text-body text-gema-gray-500">No hay registros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gema-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gema-gray-100 bg-gema-gray-50">
                <th className="py-4 pl-6 w-10">
                  <Checkbox
                    aria-label="Seleccionar todo lo cargado"
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(on) =>
                      setChecked(on === true ? new Set(rows.map((r) => r.path)) : new Set())
                    }
                  />
                </th>
                {["Fecha", "Qué", ""].map((header) => (
                  <th
                    key={header}
                    className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isOpen = expanded === row.path;
                const details = Object.entries(row.details ?? {}).filter(
                  ([, value]) => value !== undefined && value !== null && value !== ""
                );
                return (
                  <Fragment key={row.path}>
                    <tr
                      onClick={() => details.length > 0 && setExpanded(isOpen ? null : row.path)}
                      className={cn(
                        "border-b border-gema-gray-50",
                        details.length > 0 && "cursor-pointer hover:bg-gema-gray-50/50",
                        checked.has(row.path) && "bg-gema-gray-50"
                      )}
                    >
                      <td className="py-4 pl-6 w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label="Seleccionar"
                          checked={checked.has(row.path)}
                          onCheckedChange={(on) => toggle(row.path, on === true)}
                        />
                      </td>
                      <td className="py-4 px-6 text-small text-gema-gray-500 whitespace-nowrap align-top">
                        {formatDateTime(row.date)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-small text-gema-black">{row.title}</p>
                        {row.subtitle && (
                          <p className="text-caption text-gema-gray-500 mt-0.5">{row.subtitle}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gema-gray-400 w-10">
                        {details.length > 0 &&
                          (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-gema-gray-50 bg-gema-gray-50/50">
                        <td />
                        <td colSpan={3} className="px-6 py-4">
                          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-small">
                            {details.map(([key, value]) => (
                              <Fragment key={key}>
                                <dt className="text-gema-gray-500">{DETAIL_LABELS[key] || key}</dt>
                                <dd className="text-gema-black break-words">
                                  {formatDetailValue(key, value)}
                                </dd>
                              </Fragment>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && !loading && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
            Cargar más
          </Button>
        </div>
      )}

      {showDelete && (
        <DeleteModal
          source={source}
          count={checked.size}
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            const res = await deleteActivity({ source, paths: [...checked] });
            if (res.deleted > 0) {
              setChecked(new Set());
              await Promise.all([loadFirstPage(source), loadCounts()]);
            }
            return res;
          }}
        />
      )}
    </div>
  );
}

function DeleteModal({
  source,
  count,
  onClose,
  onConfirm,
}: {
  source: ActivitySource;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; deleted: number; error?: string }>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ deleted: number; error?: string } | null>(null);

  const what = ACTIVITY_SOURCES[source].toLowerCase();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      setResult(await onConfirm());
    } catch {
      setResult({ deleted: 0, error: "No se pudo borrar" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !deleting && onClose()} title="Borrar registros" size="sm">
      {result ? (
        <div className="space-y-6">
          {result.deleted > 0 && (
            <div className="flex gap-3 items-start">
              <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
              <p className="text-small text-gema-gray-700">
                {result.deleted === 1 ? "Se borró 1 registro." : `Se borraron ${result.deleted} registros.`}
              </p>
            </div>
          )}
          {result.error && (
            <div className="flex gap-2 items-start bg-red-50 text-red-700 px-3 py-2 text-small">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{result.error}</span>
            </div>
          )}
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-small text-gema-gray-700">
            Vas a borrar <strong>{count}</strong> {count === 1 ? "registro" : "registros"} de{" "}
            {what}. <strong>No se puede deshacer.</strong>
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={deleting} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting} className="flex-1">
              Borrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
