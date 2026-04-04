"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Ticket,
  LogIn,
  LogOut,
  Camera,
  X,
} from "lucide-react";
import { Ticket as TicketType } from "@/types";
import { validateTicket } from "@/server/actions/events";

const VALIDATOR_PIN = process.env.NEXT_PUBLIC_VALIDATOR_PIN || "gema2026";

export default function ValidarEntradaPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    ticket?: TicketType;
    error?: string;
  } | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
    if (scanner) {
      try {
        if (scanner.stop) await scanner.stop();
        if (scanner.clear) scanner.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  async function startScanner() {
    setScanning(true);
    setResult(null);

    // Dynamic import to avoid SSR issues
    const { Html5Qrcode } = await import("html5-qrcode");

    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR scanned - extract code (the QR contains the 6-char code)
          const scannedCode = decodedText.trim().toUpperCase().slice(0, 6);
          setCode(scannedCode);
          await stopScanner();

          // Auto-validate
          setLoading(true);
          const res = await validateTicket(scannedCode);
          setResult(res);
          setLoading(false);
        },
        () => {
          // ignore scan failures (no QR in frame)
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      await stopScanner();
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === VALIDATOR_PIN) {
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

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
      const dateVal = ticket.eventDate as unknown as
        | { seconds: number }
        | { toDate: () => Date }
        | string;
      const d =
        typeof dateVal === "object" && dateVal !== null && "seconds" in dateVal
          ? new Date(dateVal.seconds * 1000)
          : typeof dateVal === "object" && dateVal !== null && "toDate" in dateVal
          ? dateVal.toDate()
          : new Date(dateVal as string);
      return new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "—";
    }
  }

  // --- Login screen ---
  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-neutral-950 flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-xs space-y-6 text-center"
        >
          <div>
            <span className="font-serif text-2xl tracking-[0.15em] text-white">
              GEMA
            </span>
            <p className="text-neutral-500 text-xs mt-1 uppercase tracking-widest">
              Control de acceso
            </p>
          </div>

          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError(false);
              }}
              placeholder="PIN de acceso"
              className="w-full text-center text-lg bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-4 focus:outline-none focus:border-white placeholder:text-neutral-600"
              autoFocus
            />
            {pinError && (
              <p className="text-red-400 text-sm mt-2">PIN incorrecto</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-4 rounded-lg active:scale-95 transition-transform"
          >
            <LogIn className="w-4 h-4" />
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  // --- Validator screen ---
  return (
    <div className="min-h-dvh bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <div>
          <span className="font-serif text-lg tracking-[0.15em]">GEMA</span>
          <span className="text-neutral-500 text-xs ml-2">Control</span>
        </div>
        <button
          onClick={() => {
            stopScanner();
            setAuthenticated(false);
            setPin("");
            setResult(null);
            setCode("");
          }}
          className="text-neutral-500 hover:text-white transition-colors p-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* QR Scanner */}
        {scanning && (
          <div className="w-full max-w-sm mb-6">
            <div className="relative">
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full rounded-xl overflow-hidden"
              />
              <button
                type="button"
                onClick={stopScanner}
                className="absolute top-2 right-2 z-10 bg-black/70 text-white p-2 rounded-full active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-neutral-500 text-xs mt-3">
              Apuntá la cámara al código QR de la entrada
            </p>
          </div>
        )}

        {!scanning && (
          <form onSubmit={handleValidate} className="w-full max-w-sm space-y-4">
            <label className="block text-center text-neutral-400 text-xs uppercase tracking-widest mb-2">
              Código de entrada
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="A3B5K9"
              maxLength={6}
              className="w-full text-center text-4xl font-mono tracking-[0.4em] bg-neutral-900 border-2 border-neutral-700 text-white rounded-xl px-4 py-6 focus:outline-none focus:border-white uppercase placeholder:text-neutral-700"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-4 rounded-lg disabled:opacity-40 active:scale-95 transition-transform"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Validar
              </button>
              <button
                type="button"
                onClick={startScanner}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-neutral-800 text-white rounded-lg active:scale-95 transition-transform"
              >
                <Camera className="w-5 h-5" />
                QR
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-4 border border-neutral-700 text-neutral-300 rounded-lg active:scale-95 transition-transform"
                >
                  Nueva
                </button>
              )}
            </div>
          </form>
        )}

        {/* Result */}
        {result && (
          <div
            className={`w-full max-w-sm mt-8 p-6 rounded-xl border-2 ${
              result.success
                ? "bg-green-950/50 border-green-500"
                : "bg-red-950/50 border-red-500"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {result.success ? (
                <CheckCircle className="w-10 h-10 text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400 shrink-0" />
              )}
              <div>
                <p
                  className={`text-lg font-semibold ${
                    result.success ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {result.success ? "Entrada válida" : "No válida"}
                </p>
                {!result.success && (
                  <p className="text-sm text-red-400">{result.error}</p>
                )}
                {result.success && (
                  <p className="text-sm text-green-400">Ingreso registrado</p>
                )}
              </div>
            </div>

            {result.ticket && (
              <div className="mt-4 pt-4 border-t border-neutral-700 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-neutral-400" />
                  <span className="font-mono font-bold text-base">
                    {result.ticket.code}
                  </span>
                </div>
                <p>
                  <span className="text-neutral-400">Evento:</span>{" "}
                  {result.ticket.eventTitle}
                </p>
                <p>
                  <span className="text-neutral-400">Fecha:</span>{" "}
                  {formatTicketDate(result.ticket)}
                </p>
                <p>
                  <span className="text-neutral-400">Lugar:</span>{" "}
                  {result.ticket.eventLocation}
                </p>
                <p>
                  <span className="text-neutral-400">Comprador:</span>{" "}
                  {result.ticket.buyerName || result.ticket.buyerEmail}
                </p>
                <p>
                  <span className="text-neutral-400">Estado:</span>{" "}
                  <span
                    className={`font-medium ${
                      result.ticket.status === "used"
                        ? "text-amber-400"
                        : result.ticket.status === "valid"
                        ? "text-green-400"
                        : "text-red-400"
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
      </main>
    </div>
  );
}
