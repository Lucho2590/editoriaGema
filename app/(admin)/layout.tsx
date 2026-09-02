import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isServerAuthConfigured, safeNextPath } from "@/lib/auth/config";

/**
 * Authoritative guard for /admin/**. Route groups are transparent for URLs but
 * still nest layouts, so this wraps every admin page.
 */
export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isServerAuthConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return <ServerAuthNotConfigured />;
    }
    console.warn(
      "[admin] FIREBASE_ADMIN_* not set — server-side admin guard disabled (dev only)"
    );
    return <>{children}</>;
  }

  const requestHeaders = await headers();
  const pathname = safeNextPath(requestHeaders.get("x-pathname"), "/admin");

  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }
  if (!user.isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}

/**
 * Explicit failure screen rather than a redirect: in production a missing env
 * var looks exactly like a permission denial and is miserable to debug.
 */
function ServerAuthNotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center px-gutter">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-heading text-gema-black mb-4">
          Autenticación del servidor no configurada
        </h1>
        <p className="text-body text-gema-gray-500 mb-6">
          El panel de administración necesita las credenciales del Firebase
          Admin SDK para verificar la sesión. Sin ellas no es posible validar
          quién está accediendo.
        </p>
        <p className="text-small text-gema-gray-400">
          Faltan las variables de entorno{" "}
          <code className="text-gema-black">FIREBASE_ADMIN_PROJECT_ID</code>,{" "}
          <code className="text-gema-black">FIREBASE_ADMIN_CLIENT_EMAIL</code> y{" "}
          <code className="text-gema-black">FIREBASE_ADMIN_PRIVATE_KEY</code>.
        </p>
      </div>
    </div>
  );
}
