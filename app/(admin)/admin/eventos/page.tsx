"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, MapPin, Users, Ticket, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GemaEvent } from "@/types";
import { createEvent, getEvents, updateEvent, getEventTickets } from "@/server/actions/events";
import { formatCurrency } from "@/lib/utils";

export default function EventosAdminPage() {
  const [events, setEvents] = useState<GemaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const data = await getEvents();
    setEvents(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await createEvent({
      title,
      description,
      date,
      location,
      capacity: parseInt(capacity),
      price: parseInt(price),
    });

    if (result.success) {
      setMessage({ type: "success", text: "Evento creado correctamente" });
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setCapacity("");
      setPrice("");
      setShowForm(false);
      await loadEvents();
    } else {
      setMessage({ type: "error", text: result.error || "Error al crear el evento" });
    }

    setSubmitting(false);
  }

  async function handleToggleActive(event: GemaEvent) {
    setTogglingId(event.id);
    await updateEvent(event.id, { active: !event.active });
    await loadEvents();
    setTogglingId(null);
  }

  function formatEventDate(event: GemaEvent): string {
    try {
      const d = event.date && "toDate" in event.date ? event.date.toDate() : new Date(event.date as unknown as string);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-heading-xl text-gema-black">Eventos</h1>
          <p className="text-body text-gema-gray-500 mt-2">
            Gestioná eventos y entradas
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo evento
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 text-sm rounded ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gema-gray-200 p-6 space-y-4">
          <h2 className="font-serif text-heading-md text-gema-black">Nuevo evento</h2>

          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gema-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gema-gray-200 p-3 text-sm min-h-[100px] focus:outline-none focus:border-gema-black"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gema-gray-700 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gema-gray-200 p-3 text-sm focus:outline-none focus:border-gema-black"
                required
              />
            </div>
            <Input
              label="Lugar"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacidad"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
            <Input
              label="Precio (ARS)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              Crear evento
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} type="button">
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gema-gray-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gema-gray-500">
          No hay eventos creados
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-white border p-6 ${
                event.active ? "border-gema-gray-200" : "border-gema-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-serif text-heading-md text-gema-black">
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gema-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatEventDate(event)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.ticketsSold}/{event.capacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      {formatCurrency(event.price)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gema-gray-600 mt-2">{event.description}</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleToggleActive(event)}
                  loading={togglingId === event.id}
                  className="shrink-0 ml-4"
                >
                  {event.active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" /> Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" /> Activar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
