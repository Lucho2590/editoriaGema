import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isServerAuthConfigured } from "@/lib/auth/config";

/**
 * Superadmin-only section. The parent admin layout already requires admin;
 * this narrows it further on the server, so hiding the menu item isn't the
 * only protection.
 */
export default async function AuditoriaLayout({ children }: { children: React.ReactNode }) {
  if (isServerAuthConfigured()) {
    const user = await getSessionUser();
    if (!user?.isSuperAdmin) redirect("/admin");
  }
  return <>{children}</>;
}
