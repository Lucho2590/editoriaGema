"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Book,
  ShoppingBag,
  Users,
  BarChart3,
  LogOut,
  UserCog,
  Calendar,
  ScanLine,
  CreditCard,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "gema-admin-sidebar-collapsed";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/libros", label: "Libros", icon: Book },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/usuarios", label: "Administradores", icon: UserCog },
  { href: "/admin/eventos", label: "Eventos", icon: Calendar },
  { href: "/admin/validar-entrada", label: "Validar entrada", icon: ScanLine },
  { href: "/admin/configuracion", label: "MercadoPago", icon: CreditCard },
  { href: "/admin/transferencia", label: "Transferencia", icon: Landmark },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, gemaUser, loading, isAdmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  // Secondary guard: app/(admin)/layout.tsx already gates this server-side,
  // but this covers client-side navigation once the session goes stale.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body text-gema-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
    // Drop the RSC router cache so the server layout re-runs without a cookie.
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gema-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-gema-black text-gema-white transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-gema-black border border-gema-gray-700 flex items-center justify-center text-gema-gray-300 hover:text-gema-white hover:border-gema-white transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("p-6", collapsed && "px-4")}>
          <Link href="/admin" className="block">
            {collapsed ? (
              <span className="font-serif text-heading tracking-[0.1em]">G</span>
            ) : (
              <>
                <span className="font-serif text-heading tracking-[0.1em]">GEMA</span>
                <span className="block text-caption text-gema-gray-400 mt-1">Admin</span>
              </>
            )}
          </Link>
        </div>

        <nav className="mt-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-3 text-small text-gema-gray-400 hover:text-gema-white hover:bg-gema-gray-900 transition-colors",
                collapsed ? "justify-center px-4" : "px-6"
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 border-t border-gema-gray-800",
            collapsed ? "p-4" : "p-6"
          )}
        >
          {!collapsed && (
            <div className="mb-4">
              <p className="text-small text-gema-white truncate">{gemaUser?.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "flex items-center gap-2 text-small text-gema-gray-400 hover:text-gema-white transition-colors",
              collapsed && "justify-center w-full"
            )}
          >
            <LogOut size={16} />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-[margin] duration-200",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
