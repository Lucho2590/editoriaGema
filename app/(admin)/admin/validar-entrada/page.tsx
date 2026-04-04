"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Search, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Ticket as TicketType } from "@/types";
import { validateTicket } from "@/server/actions/events";

export default function ValidarEntradaPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    ticket?: TicketType;
    error?: string;
  } | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    const res = await validateTicket(code);
    setResult(res);
    setLoading(false);
  }

  function handleReset() {
    setCode("");
    setResult(null);
  }

  function formatTicketDate(ticket: TicketType): string {
    try {
      const d =
        ticket.eventDate && "toDate" in ticket.eventDate
          ? ticket.eventDate.toDate()
          : new Date(ticket.eventDate as unknown as string);
      return new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "Fecha no disponible";
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-serif text-heading-xl text-gema-black">
          Validar entrada
        </h1>
        <p className="text-body text-gema-gray-500 mt-2">
          Ingresá el código de 6 dígitos para validar el ingreso
        </p>
      </div>

      <form onSubmit={handleValidate} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Ej: A3B5K9"
            maxLength={6}
            className="w-full text-center text-3xl font-mono tracking-[0.3em] border-2 border-gema-gray-200 p-6 focus:outline-none focus:border-gema-black uppercase"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={loading} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Validar
          </Button>
          {result && (
            <Button variant="secondary" onClick={handleReset} type="button">
              Limpiar
            </Button>
          )}
        </div>
      </form>

      {result && (
        <div
          className={`p-6 rounded border-2 ${
            result.success
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {result.success ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-800">
                    Entrada válida
                  </p>
                  <p className="text-sm text-green-600">
                    Ingreso registrado correctamente
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-lg font-semibold text-red-800">
                    Entrada no válida
                  </p>
                  <p className="text-sm text-red-600">{result.error}</p>
                </div>
              </>
            )}
          </div>

          {result.ticket && (
            <div className="mt-4 pt-4 border-t border-current/10 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="w-4 h-4" />
                <span className="font-mono font-bold">{result.ticket.code}</span>
              </div>
              <p className="text-sm">
                <strong>Evento:</strong> {result.ticket.eventTitle}
              </p>
              <p className="text-sm">
                <strong>Fecha:</strong> {formatTicketDate(result.ticket)}
              </p>
              <p className="text-sm">
                <strong>Lugar:</strong> {result.ticket.eventLocation}
              </p>
              <p className="text-sm">
                <strong>Comprador:</strong>{" "}
                {result.ticket.buyerName || result.ticket.buyerEmail}
              </p>
              <p className="text-sm">
                <strong>Estado:</strong>{" "}
                <span
                  className={`font-medium ${
                    result.ticket.status === "used"
                      ? "text-amber-600"
                      : result.ticket.status === "valid"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {result.ticket.status === "valid"
                    ? "Válida"
                    : result.ticket.status === "used"
                    ? "Usada"
                    : "Cancelada"}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
