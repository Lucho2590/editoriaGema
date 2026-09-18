"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  ExternalLink,
  X,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function toJsDate(d: Order["createdAt"]): Date {
  return "toDate" in d ? d.toDate() : (d as unknown as Date);
}

function formatShortDate(d: Order["createdAt"]): string {
  const date = toJsDate(d);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatDateTimeTooltip(d: Order["createdAt"]): string {
  const date = toJsDate(d);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(d: Order["createdAt"]): string {
  const date = toJsDate(d);
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  confirmTransferOrder,
  rejectTransferOrder,
  resendOrderDownloads,
} from "@/server/actions/orders";

type Filter = "all" | "completed" | "pending" | "transfer";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [resendTarget, setResendTarget] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"))
      );
      const ordersData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === "completed") return order.paymentStatus === "completed";
      if (filter === "pending") return order.paymentStatus === "pending";
      if (filter === "transfer") {
        return (
          order.paymentProvider === "transfer" &&
          order.paymentStatus !== "completed"
        );
      }
      return true;
    });
  }, [orders, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  // Clamp instead of storing, so a reload that shrinks the list never leaves an empty page
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-body text-gema-gray-500">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-heading-xl text-gema-black">Pedidos</h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Gestiona y revisa todos los pedidos de la tienda.
        </p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        {(["all", "completed", "pending", "transfer"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={cn(
              "text-small px-4 py-2 transition-colors",
              filter === f
                ? "text-gema-black bg-gema-gray-100"
                : "text-gema-gray-500 hover:text-gema-black"
            )}
          >
            {f === "all" && "Todos"}
            {f === "completed" && "Completados"}
            {f === "pending" && "Pendientes"}
            {f === "transfer" && "Transferencias por verificar"}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gema-gray-100">
          <p className="text-body text-gema-gray-500">No hay pedidos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gema-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gema-gray-100 bg-gema-gray-50">
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Pedido
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Cliente
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Items
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Tipo
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Método
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Total
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Estado
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Fecha
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  className="border-b border-gema-gray-50 hover:bg-gema-gray-50/50 cursor-pointer"
                >
                  <td className="py-4 px-6 text-small text-gema-black font-mono">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.userEmail}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "libro" : "libros"}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.hasDigitalItems && !order.hasPrintItems && "Digital"}
                    {!order.hasDigitalItems && order.hasPrintItems && "Impreso"}
                    {order.hasDigitalItems && order.hasPrintItems && "Mixto"}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    <MethodBadge provider={order.paymentProvider} />
                  </td>
                  <td className="py-4 px-6 text-small text-gema-black font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-500 whitespace-nowrap">
                    <span className="relative group inline-block">
                      {formatShortDate(order.createdAt)}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gema-black text-gema-white text-caption px-2 py-1 rounded shadow-md z-10">
                        {formatTime(order.createdAt)} hs
                        <span className="block text-gema-gray-400 text-[10px] mt-0.5">
                          {formatDateTimeTooltip(order.createdAt)}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {order.paymentStatus === "completed" && order.hasDigitalItems && (
                      <button
                        type="button"
                        onClick={(e) => {
                          // The row itself opens the detail drawer
                          e.stopPropagation();
                          setResendTarget(order);
                        }}
                        title="Reenviar libros"
                        aria-label="Reenviar libros"
                        className="p-1 text-gema-gray-500 hover:text-gema-black transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length > PAGE_SIZE_OPTIONS[0] && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gema-gray-100">
              <div className="flex items-center gap-6">
                <p className="text-small text-gema-gray-500">
                  Mostrando {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredOrders.length)} de{" "}
                  {filteredOrders.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-small text-gema-gray-500">Por página</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-20 px-3 py-1 text-small">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 text-small text-gema-gray-500 hover:text-gema-black transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="text-small text-gema-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 text-small text-gema-gray-500 hover:text-gema-black transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {resendTarget && (
        <ResendDownloadsModal
          order={resendTarget}
          onClose={() => setResendTarget(null)}
        />
      )}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          onClose={() => setSelectedId(null)}
          onMutated={async () => {
            await loadOrders();
          }}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({
  order,
  onClose,
  onMutated,
}: {
  order: Order;
  onClose: () => void;
  onMutated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isTransfer = order.paymentProvider === "transfer";
  const canAct = isTransfer && order.paymentStatus !== "completed";

  const handleConfirm = async () => {
    if (!confirm("¿Confirmar este pago? Se va a enviar el email con los libros.")) return;
    setBusy("confirm");
    setError(null);
    try {
      const res = await confirmTransferOrder(order.id);
      if (!res.success) throw new Error(res.error || "No se pudo confirmar");
      await onMutated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    setError(null);
    try {
      const res = await rejectTransferOrder(order.id, rejectReason);
      if (!res.success) throw new Error(res.error || "No se pudo rechazar");
      await onMutated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative ml-auto h-full w-full max-w-xl bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gema-gray-100">
          <div>
            <h2 className="font-serif text-heading text-gema-black">
              Pedido #{order.id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-small text-gema-gray-500">
              {formatDate(order.createdAt)} · {order.userEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gema-gray-400 hover:text-gema-black"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-caption uppercase tracking-wider text-gema-gray-500 mb-3">
              Items
            </h3>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between text-small text-gema-gray-700"
                >
                  <span>
                    {item.bookTitle} ({item.format.toUpperCase()}) × {item.quantity}
                  </span>
                  <span className="text-gema-black">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 text-small">
              <div className="flex justify-between text-gema-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount && (
                <div className="flex justify-between text-green-700">
                  <span>
                    Descuento ({order.discount.percentage}%)
                  </span>
                  <span>-{formatCurrency(order.discount.amount)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between text-gema-gray-600">
                  <span>Envío</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-body pt-2 border-t border-gema-gray-100">
                <span className="text-gema-black font-medium">Total</span>
                <span className="text-gema-black font-medium">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-caption uppercase tracking-wider text-gema-gray-500 mb-3">
              Pago
            </h3>
            <div className="space-y-1 text-small">
              <div className="flex justify-between">
                <span className="text-gema-gray-500">Método</span>
                <MethodBadge provider={order.paymentProvider} />
              </div>
              <div className="flex justify-between">
                <span className="text-gema-gray-500">Estado</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentId && (
                <div className="flex justify-between gap-4">
                  <span className="text-gema-gray-500 shrink-0">ID</span>
                  <span className="text-gema-black font-mono truncate" title={order.paymentId}>
                    {order.paymentId}
                  </span>
                </div>
              )}
            </div>
          </section>

          {order.hasPrintItems && order.shippingAddress && (
            <section>
              <h3 className="text-caption uppercase tracking-wider text-gema-gray-500 mb-3">
                Envío
              </h3>
              <p className="text-small text-gema-gray-700 leading-relaxed">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}
                <br />
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                {order.shippingAddress.phone && (
                  <>
                    <br />
                    Tel: {order.shippingAddress.phone}
                  </>
                )}
              </p>
            </section>
          )}

          {isTransfer && (
            <section>
              <h3 className="text-caption uppercase tracking-wider text-gema-gray-500 mb-3">
                Datos de la transferencia
              </h3>
              {order.transferDetails ? (
                <div className="space-y-1 text-small text-gema-gray-700">
                  <div className="flex justify-between gap-4">
                    <span className="text-gema-gray-500 shrink-0">Nombre</span>
                    <span className="text-gema-black truncate">{order.transferDetails.buyerName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gema-gray-500 shrink-0">DNI</span>
                    <span className="text-gema-black">{order.transferDetails.buyerDni}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gema-gray-500 shrink-0">Teléfono</span>
                    <span className="text-gema-black">{order.transferDetails.buyerPhone}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gema-gray-500 shrink-0">Banco origen</span>
                    <span className="text-gema-black truncate">{order.transferDetails.buyerBank}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gema-gray-500 shrink-0">Cuenta origen</span>
                    <span className="text-gema-black truncate">{order.transferDetails.buyerAccount}</span>
                  </div>
                  <div className="flex justify-between gap-4 items-center">
                    <span className="text-gema-gray-500 shrink-0">Comprobante</span>
                    {order.transferDetails.receiptUrl ? (
                      <ReceiptPreview
                        url={order.transferDetails.receiptUrl}
                        storagePath={order.transferDetails.receiptStoragePath}
                      />
                    ) : (
                      <span className="text-caption text-gema-gray-500">
                        Sin adjuntar
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-small text-gema-gray-500">
                  El comprador aún no completó los datos de la transferencia.
                </p>
              )}

              {order.transferRejectionReason && (
                <p className="mt-3 text-caption text-red-600">
                  Rechazado: {order.transferRejectionReason}
                </p>
              )}
            </section>
          )}

          {canAct && (
            <section className="pt-4 border-t border-gema-gray-100 space-y-3">
              {error && <p className="text-small text-red-500">{error}</p>}
              <Button
                onClick={handleConfirm}
                loading={busy === "confirm"}
                disabled={busy !== null}
                className="w-full"
              >
                Marcar como pagado
              </Button>
              <div className="space-y-2">
                <Input
                  placeholder="Motivo del rechazo (opcional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={handleReject}
                  loading={busy === "reject"}
                  disabled={busy !== null}
                  className="w-full"
                >
                  Rechazar
                </Button>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function ResendDownloadsModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const digitalItems = order.items.filter(
    (item) => item.format === "pdf" || item.format === "epub"
  );

  const handleResend = async () => {
    setState("sending");
    setError(null);
    try {
      const res = await resendOrderDownloads(order.id);
      if (!res.success) throw new Error(res.error || "No se pudo reenviar");
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "No se pudo reenviar");
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => state !== "sending" && onClose()}
      title="Reenviar libros"
      size="sm"
    >
      {state === "sent" ? (
        <div className="space-y-6">
          <div className="flex gap-3 items-start">
            <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
            <p className="text-small text-gema-gray-700">
              Listo. Los links de descarga se enviaron a{" "}
              <span className="text-gema-black">{order.userEmail}</span>.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3 text-small text-gema-gray-700">
            <p>
              Se va a enviar un email con links de descarga nuevos (válidos por 7
              días) a <span className="text-gema-black">{order.userEmail}</span>.
            </p>
            <ul className="border border-gema-gray-100 divide-y divide-gema-gray-100">
              {digitalItems.map((item, i) => (
                <li key={i} className="flex justify-between gap-4 px-3 py-2">
                  <span className="text-gema-black truncate">{item.bookTitle}</span>
                  <span className="text-gema-gray-500 shrink-0">
                    {item.format.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {state === "error" && error && (
            <div className="flex gap-2 items-start bg-red-50 text-red-700 px-3 py-2 text-small">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={state === "sending"}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResend}
              loading={state === "sending"}
              className="flex-1"
            >
              {state === "error" ? "Reintentar" : "Reenviar"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ReceiptPreview({
  url,
  storagePath,
}: {
  url: string;
  storagePath?: string;
}) {
  const [open, setOpen] = useState(false);
  const ext = (storagePath?.split(".").pop() || "").toLowerCase();
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1 text-gema-gray-500 hover:text-gema-black transition-colors"
        aria-label="Ver comprobante"
      >
        <Eye size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative bg-white max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gema-gray-100">
              <p className="text-small text-gema-black">Comprobante</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gema-gray-400 hover:text-gema-black"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gema-gray-50">
              {isPdf ? (
                <iframe
                  src={url}
                  title="Comprobante de transferencia"
                  className="w-full h-[75vh] bg-white"
                />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Comprobante de transferencia"
                  className="w-full max-h-[75vh] object-contain bg-white"
                />
              ) : (
                <div className="p-12 text-center text-small text-gema-gray-500">
                  No se puede previsualizar este formato.{" "}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-gema-black inline-flex items-center gap-1"
                  >
                    Abrir <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MethodBadge({ provider }: { provider: Order["paymentProvider"] }) {
  const labels: Record<Order["paymentProvider"], string> = {
    mercadopago: "MercadoPago",
    transfer: "Transferencia",
    stripe: "Stripe",
  };
  return <span className="text-small text-gema-gray-700">{labels[provider] || provider}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    processing: "bg-blue-100 text-blue-700",
    refunded: "bg-gray-100 text-gray-700",
  };

  const labels = {
    completed: "Completado",
    pending: "Pendiente",
    failed: "Fallido",
    processing: "Procesando",
    refunded: "Reembolsado",
  };

  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-caption rounded",
        styles[status as keyof typeof styles] || styles.pending
      )}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "flex h-11 w-full border border-gema-gray-200 bg-transparent px-4 py-3 text-body text-gema-black placeholder:text-gema-gray-400 focus:outline-none focus:border-gema-black focus:ring-1 focus:ring-gema-black/10 transition-colors",
        props.className
      )}
    />
  );
}
