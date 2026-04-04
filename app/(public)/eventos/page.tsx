"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GemaEvent } from "@/types";
import { getEvents, simulateTicketPurchase, purchaseTicket } from "@/server/actions/events";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";

export default function EventosPage() {
  const { user, gemaUser } = useAuth();
  const [events, setEvents] = useState<GemaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; code?: string; error?: string } | null>(null);

  const isDev = process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ?? false;

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (user?.email) setBuyerEmail(user.email);
    if (user?.displayName) setBuyerName(user.displayName);
  }, [user]);

  async function loadEvents() {
    setLoading(true);
    const data = await getEvents(true);
    setEvents(data);
    setLoading(false);
  }

  async function handlePurchase(eventId: string, simulate: boolean) {
    if (!buyerEmail) return;
    setPurchaseLoading(true);
    setResult(null);

    const input = {
      eventId,
      buyerEmail,
      buyerName: buyerName || undefined,
      buyerId: user?.uid,
    };

    const res = simulate
      ? await simulateTicketPurchase(input)
      : await purchaseTicket(input);

    setResult({ success: res.success, code: res.code, error: res.error });
    setPurchaseLoading(false);

    if (res.success) {
      await loadEvents();
    }
  }

  function formatEventDate(event: GemaEvent): string {
    try {
      const dateVal = event.date as unknown as { seconds: number } | { toDate: () => Date } | string;
      const d = typeof dateVal === "object" && dateVal !== null && "seconds" in dateVal
        ? new Date(dateVal.seconds * 1000)
        : typeof dateVal === "object" && dateVal !== null && "toDate" in dateVal
        ? dateVal.toDate()
        : new Date(dateVal as string);
      return new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "Fecha no disponible";
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="font-serif text-display text-gema-black">Eventos</h1>
        <p className="text-body text-gema-gray-500 mt-4">
          Charlas, presentaciones y encuentros
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gema-gray-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gema-gray-500">
          No hay eventos próximos
        </div>
      ) : (
        <div className="space-y-8">
          {events.map((event) => {
            const soldOut = event.ticketsSold >= event.capacity;
            const isBuying = buyingId === event.id;

            return (
              <div key={event.id} className="border border-gema-gray-200 p-8">
                <div className="space-y-4">
                  <h2 className="font-serif text-heading-xl text-gema-black">
                    {event.title}
                  </h2>

                  <div className="flex flex-wrap gap-6 text-sm text-gema-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatEventDate(event)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {event.capacity - event.ticketsSold} lugares disponibles
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-body text-gema-gray-600">{event.description}</p>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-heading-md font-serif text-gema-black">
                      {formatCurrency(event.price)}
                    </span>

                    {soldOut ? (
                      <span className="text-sm text-red-500 font-medium">Agotado</span>
                    ) : !isBuying ? (
                      <Button onClick={() => setBuyingId(event.id)}>
                        <Ticket className="w-4 h-4 mr-2" />
                        Comprar entrada
                      </Button>
                    ) : null}
                  </div>

                  {isBuying && !result?.success && (
                    <div className="border-t border-gema-gray-100 pt-6 mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Email"
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          required
                        />
                        <Input
                          label="Nombre (opcional)"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                        />
                      </div>

                      {result?.error && (
                        <p className="text-sm text-red-500">{result.error}</p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => handlePurchase(event.id, false)}
                          loading={purchaseLoading}
                        >
                          Pagar {formatCurrency(event.price)}
                        </Button>
                        {isDev && (
                          <Button
                            onClick={() => handlePurchase(event.id, true)}
                            loading={purchaseLoading}
                            className="!bg-amber-600 hover:!bg-amber-700"
                          >
                            Simular Compra (Dev)
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setBuyingId(null);
                            setResult(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {isBuying && result?.success && (
                    <div className="border-t border-gema-gray-100 pt-6 mt-4">
                      <div className="bg-green-50 border border-green-200 p-6 rounded text-center space-y-2">
                        <p className="text-green-800 font-semibold text-lg">
                          ¡Entrada comprada!
                        </p>
                        <p className="text-green-700 text-sm">
                          Tu código de entrada es:
                        </p>
                        <p className="font-mono text-3xl font-bold tracking-[0.3em] text-green-900">
                          {result.code}
                        </p>
                        <p className="text-green-600 text-sm">
                          Revisá tu email ({buyerEmail}) — te enviamos la entrada con el QR.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setBuyingId(null);
                            setResult(null);
                          }}
                          className="mt-4"
                        >
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
