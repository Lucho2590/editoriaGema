"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

  useEffect(() => {
    async function loadOrders() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "orders"), orderBy("createdAt", "desc"))
        );
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (filter === "completed") return order.paymentStatus === "completed";
    if (filter === "pending") return order.paymentStatus === "pending";
    return true;
  });

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

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {(["all", "completed", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
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
                  Total
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Estado
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gema-gray-50 hover:bg-gema-gray-50/50">
                  <td className="py-4 px-6 text-small text-gema-black font-mono">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.userEmail}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.items.length} {order.items.length === 1 ? "libro" : "libros"}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {order.hasDigitalItems && !order.hasPrintItems && "Digital"}
                    {!order.hasDigitalItems && order.hasPrintItems && "Impreso"}
                    {order.hasDigitalItems && order.hasPrintItems && "Mixto"}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-black font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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
