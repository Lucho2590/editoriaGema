"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  UserPlus,
  Send,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createAdminUser,
  getAdminUsers,
  removeAdminPrivilege,
  resendAdminInvitation,
} from "@/server/actions/users";

interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
  createdAt: string | null;
}

interface FormData {
  email: string;
  displayName: string;
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAdminUsers();
    if (result.success) {
      setUsers(result.users);
    }
    setLoading(false);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setMessage(null);

    const result = await createAdminUser({
      email: data.email,
      displayName: data.displayName || undefined,
    });

    if (result.success) {
      setMessage({
        type: "success",
        text: `Usuario creado exitosamente. Se envió un email de invitación a ${data.email}`,
      });
      reset();
      loadUsers();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al crear el usuario",
      });
    }

    setSubmitting(false);
  };

  const handleResendInvitation = async (user: AdminUser) => {
    setResendingId(user.id);
    setMessage(null);

    const result = await resendAdminInvitation(user.email, user.displayName);

    if (result.success) {
      setMessage({
        type: "success",
        text: `Invitación reenviada a ${user.email}`,
      });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al reenviar la invitación",
      });
    }

    setResendingId(null);
  };

  const handleRemoveAdmin = async (user: AdminUser) => {
    if (
      !confirm(
        `¿Estás seguro de que querés quitar los permisos de admin a ${user.email}?`,
      )
    ) {
      return;
    }

    setRemovingId(user.id);
    setMessage(null);

    const result = await removeAdminPrivilege(user.id);

    if (result.success) {
      setMessage({
        type: "success",
        text: `Se quitaron los permisos de admin a ${user.email}`,
      });
      loadUsers();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Error al quitar permisos",
      });
    }

    setRemovingId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-title text-gema-black">
          Administradores
        </h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Gestiona los usuarios con acceso al panel de administración
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-sm flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          )}
          <p className="text-small">{message.text}</p>
        </div>
      )}

      {/* Create Form */}
      <div className="bg-gema-white p-6 rounded-sm border border-gema-gray-200 mb-8">
        <h2 className="text-heading font-medium text-gema-black mb-4">
          Crear nuevo administrador
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-small font-medium text-gema-gray-700 mb-1"
              >
                Email *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                {...register("email", {
                  required: "El email es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && (
                <p className="text-caption text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="displayName"
                className="block text-small font-medium text-gema-gray-700 mb-1"
              >
                Nombre (opcional)
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="Juan Pérez"
                {...register("displayName")}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Crear administrador
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-gema-white rounded-sm border border-gema-gray-200">
        <div className="px-6 py-4 border-b border-gema-gray-200">
          <h2 className="text-heading font-medium text-gema-black">
            Administradores actuales
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2
              size={24}
              className="animate-spin mx-auto text-gema-gray-400"
            />
            <p className="text-small text-gema-gray-500 mt-2">Cargando...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-body text-gema-gray-500">
              No hay administradores registrados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gema-gray-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-body font-medium text-gema-black">
                    {user.displayName || user.email}
                  </p>
                  {user.displayName && (
                    <p className="text-small text-gema-gray-500">
                      {user.email}
                    </p>
                  )}
                  <p className="text-caption text-gema-gray-400 mt-1">
                    Creado: {formatDate(user.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvitation(user)}
                    disabled={resendingId === user.id}
                    title="Reenviar invitación"
                  >
                    {resendingId === user.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAdmin(user)}
                    disabled={removingId === user.id}
                    title="Quitar permisos de admin"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingId === user.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserX size={16} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
