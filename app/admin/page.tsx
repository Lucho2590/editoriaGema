"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, Book } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Book as BookIcon, DollarSign } from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalBooks: number;
  recentOrders: Order[];
  digitalSales: number;
  printSales: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Get all completed orders
        const ordersSnapshot = await getDocs(
          query(
            collection(db, "orders"),
            where("paymentStatus", "==", "completed"),
            orderBy("createdAt", "desc")
          )
        );

        const orders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Get all books
        const booksSnapshot = await getDocs(collection(db, "books"));

        // Calculate stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const digitalSales = orders.filter((o) => o.hasDigitalItems && !o.hasPrintItems).length;
        const printSales = orders.filter((o) => o.hasPrintItems).length;

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalBooks: booksSnapshot.size,
          recentOrders: orders.slice(0, 5),
          digitalSales,
          printSales,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-body text-gema-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-body text-gema-gray-500">Error al cargar estadísticas</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-heading-xl text-gema-black">Dashboard</h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Resumen de ventas y métricas de GEMA Editorial.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          label="Ingresos totales"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Pedidos"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
        />
        <StatCard
          label="Libros publicados"
          value={stats.totalBooks.toString()}
          icon={BookIcon}
        />
        <StatCard
          label="Ventas digitales"
          value={`${stats.digitalSales} (${Math.round((stats.digitalSales / Math.max(stats.totalOrders, 1)) * 100)}%)`}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
        <h2 className="font-serif text-heading text-gema-black mb-6">
          Pedidos recientes
        </h2>

        {stats.recentOrders.length === 0 ? (
          <p className="text-body text-gema-gray-500">No hay pedidos aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gema-gray-100">
                  <th className="text-left py-3 text-caption uppercase tracking-wider text-gema-gray-400">
                    Pedido
                  </th>
                  <th className="text-left py-3 text-caption uppercase tracking-wider text-gema-gray-400">
                    Cliente
                  </th>
                  <th className="text-left py-3 text-caption uppercase tracking-wider text-gema-gray-400">
                    Tipo
                  </th>
                  <th className="text-left py-3 text-caption uppercase tracking-wider text-gema-gray-400">
                    Total
                  </th>
                  <th className="text-left py-3 text-caption uppercase tracking-wider text-gema-gray-400">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gema-gray-50">
                    <td className="py-4 text-small text-gema-black">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 text-small text-gema-gray-600">
                      {order.userEmail}
                    </td>
                    <td className="py-4 text-small text-gema-gray-600">
                      {order.hasDigitalItems && "Digital"}
                      {order.hasDigitalItems && order.hasPrintItems && " + "}
                      {order.hasPrintItems && "Impreso"}
                    </td>
                    <td className="py-4 text-small text-gema-black">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-4 text-small text-gema-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
          <h3 className="font-serif text-heading text-gema-black mb-4">
            Ventas por formato
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-small mb-1">
                <span className="text-gema-gray-600">Digital</span>
                <span className="text-gema-black">{stats.digitalSales} pedidos</span>
              </div>
              <div className="h-2 bg-gema-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gema-black rounded-full"
                  style={{
                    width: `${(stats.digitalSales / Math.max(stats.totalOrders, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-small mb-1">
                <span className="text-gema-gray-600">Impreso</span>
                <span className="text-gema-black">{stats.printSales} pedidos</span>
              </div>
              <div className="h-2 bg-gema-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gema-gray-400 rounded-full"
                  style={{
                    width: `${(stats.printSales / Math.max(stats.totalOrders, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption uppercase tracking-wider text-gema-gray-400 mb-2">
            {label}
          </p>
          <p className="text-heading-lg text-gema-black">{value}</p>
        </div>
        <div className="p-2 bg-gema-gray-50 rounded">
          <Icon size={20} className="text-gema-gray-400" />
        </div>
      </div>
    </div>
  );
}
