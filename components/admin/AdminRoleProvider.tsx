"use client";

import { createContext, useContext } from "react";

interface AdminRole {
  isSuperAdmin: boolean;
}

const AdminRoleContext = createContext<AdminRole>({ isSuperAdmin: false });

/**
 * Exposes the server-verified role to admin client components. UI only:
 * superadmin actions and pages check the role again on the server.
 */
export function AdminRoleProvider({
  isSuperAdmin,
  children,
}: AdminRole & { children: React.ReactNode }) {
  return (
    <AdminRoleContext.Provider value={{ isSuperAdmin }}>{children}</AdminRoleContext.Provider>
  );
}

export function useAdminRole(): AdminRole {
  return useContext(AdminRoleContext);
}
