"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CustomerSummary {
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: Date;
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "orders"), orderBy("createdAt", "desc"))
        );
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Group orders by customer email
        const customerMap = new Map<string, CustomerSummary>();

        orders.forEach((order) => {
          if (order.paymentStatus !== "completed") return;

          const existing = customerMap.get(order.userEmail);
          if (existing) {
            existing.totalOrders += 1;
            existing.totalSpent += order.total;
          } else {
            customerMap.set(order.userEmail, {
              email: order.userEmail,
              totalOrders: 1,
              totalSpent: order.total,
              lastOrder: order.createdAt.toDate(),
            });
          }
        });

        // Sort by total spent
        const sortedCustomers = Array.from(customerMap.values()).sort(
          (a, b) => b.totalSpent - a.totalSpent
        );

        setCustomers(sortedCustomers);
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-body text-gema-gray-500">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-heading-xl text-gema-black">Clientes</h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Lista de clientes con compras completadas.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gema-gray-100">
          <p className="text-body text-gema-gray-500">No hay clientes aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gema-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gema-gray-100 bg-gema-gray-50">
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Email
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Pedidos
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Total gastado
                </th>
                <th className="text-left py-4 px-6 text-caption uppercase tracking-wider text-gema-gray-400">
                  Última compra
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.email}
                  className="border-b border-gema-gray-50 hover:bg-gema-gray-50/50"
                >
                  <td className="py-4 px-6 text-small text-gema-black">
                    {customer.email}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-600">
                    {customer.totalOrders}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-black font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="py-4 px-6 text-small text-gema-gray-500">
                    {formatDate(customer.lastOrder)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
          <p className="text-caption uppercase tracking-wider text-gema-gray-400 mb-2">
            Total clientes
          </p>
          <p className="text-heading-lg text-gema-black">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
          <p className="text-caption uppercase tracking-wider text-gema-gray-400 mb-2">
            Promedio por cliente
          </p>
          <p className="text-heading-lg text-gema-black">
            {customers.length > 0
              ? formatCurrency(
                  customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
                )
              : formatCurrency(0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gema-gray-100 p-6">
          <p className="text-caption uppercase tracking-wider text-gema-gray-400 mb-2">
            Cliente top
          </p>
          <p className="text-heading-lg text-gema-black">
            {customers.length > 0 ? formatCurrency(customers[0].totalSpent) : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
