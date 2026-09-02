import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  // LoginForm reads the `next` search param, which requires a Suspense
  // boundary in the App Router.
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="page-transition min-h-[70vh] flex items-center justify-center">
      <p className="text-body text-gema-gray-500">Cargando...</p>
    </div>
  );
}
