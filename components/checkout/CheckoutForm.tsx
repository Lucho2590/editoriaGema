"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { getBookPrice, formatBookPrice, PaymentProvider } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOrder } from "@/server/actions/orders";
import { createPayment } from "@/lib/payments";
import { trackCheckoutStarted } from "@/lib/analytics";

export function CheckoutForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();

  const [step, setStep] = useState<"cart" | "info" | "payment">("cart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState(user?.email || "");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("mercadopago");

  // Shipping form state (only for print items)
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "AR",
    phone: "",
  });

  const subtotal = getSubtotal();
  const hasPrintItems = items.some((item) => item.format === "print");
  const hasDigitalItems = items.some((item) => item.format !== "print");
  const shippingCost = hasPrintItems ? 1500 : 0; // Fixed shipping for Argentina
  const total = subtotal + shippingCost;

  const handleProceedToInfo = () => {
    if (items.length === 0) return;
    trackCheckoutStarted(items.length, total);
    setStep("info");
  };

  const handleProceedToPayment = async () => {
    if (!email) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (hasPrintItems && (!shippingInfo.fullName || !shippingInfo.street || !shippingInfo.city)) {
      setError("Por favor completa la información de envío");
      return;
    }

    setStep("payment");
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create order
      const orderResult = await createOrder({
        userEmail: email,
        userId: user?.uid,
        items: items.map((item) => ({
          bookId: item.bookId,
          bookTitle: item.book.title,
          bookAuthor: item.book.author,
          format: item.format,
          price: getBookPrice(item.book, item.format),
          quantity: item.quantity,
        })),
        paymentProvider,
        shippingAddress: hasPrintItems ? shippingInfo : undefined,
      });

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || "Error al crear el pedido");
      }

      // Create payment
      const paymentResult = await createPayment({
        provider: paymentProvider,
        orderId: orderResult.orderId,
        items: items.map((item) => ({
          bookId: item.bookId,
          bookTitle: item.book.title,
          bookAuthor: item.book.author,
          format: item.format,
          price: getBookPrice(item.book, item.format),
          quantity: item.quantity,
        })),
        total,
        customerEmail: email,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout`,
      });

      if (!paymentResult.success || !paymentResult.checkoutUrl) {
        throw new Error(paymentResult.error || "Error al procesar el pago");
      }

      // Clear cart and redirect
      clearCart();
      window.location.href = paymentResult.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
      setLoading(false);
    }
  };

  if (items.length === 0 && step === "cart") {
    return (
      <div className="text-center py-section">
        <h2 className="font-serif text-heading-xl text-gema-black mb-4">
          Tu carrito está vacío
        </h2>
        <p className="text-body-lg text-gema-gray-500 mb-8">
          Explora nuestro catálogo y encuentra tu próxima lectura.
        </p>
        <Button onClick={() => router.push("/catalogo")}>
          Ver catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {step === "cart" && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-serif text-heading-xl text-gema-black mb-8">
                Carrito
              </h2>

              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={`${item.bookId}-${item.format}`}
                    className="flex gap-6 pb-6 border-b border-gema-gray-100"
                  >
                    {/* Cover */}
                    <div className="relative w-20 h-28 bg-gema-gray-50 flex-shrink-0">
                      <Image
                        src={item.book.coverImage}
                        alt={item.book.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-serif text-heading text-gema-black">
                        {item.book.title}
                      </h3>
                      <p className="text-small text-gema-gray-500 mb-2">
                        {item.book.author}
                      </p>
                      <p className="text-caption uppercase tracking-wider text-gema-gray-400">
                        {item.format}
                      </p>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex flex-col items-end justify-between">
                      <p className="text-body text-gema-black">
                        {formatCurrency(getBookPrice(item.book, item.format) * item.quantity)}
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity - 1)}
                          className="p-1 text-gema-gray-400 hover:text-gema-black transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-small w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity + 1)}
                          className="p-1 text-gema-gray-400 hover:text-gema-black transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeItem(item.bookId, item.format)}
                          className="p-1 ml-2 text-gema-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button onClick={handleProceedToInfo} size="lg" className="w-full md:w-auto">
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-serif text-heading-xl text-gema-black mb-8">
                Información
              </h2>

              <div className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />

                {hasPrintItems && (
                  <>
                    <h3 className="text-heading text-gema-black pt-4">
                      Dirección de envío
                    </h3>

                    <Input
                      label="Nombre completo"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                      required
                    />

                    <Input
                      label="Dirección"
                      value={shippingInfo.street}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                      placeholder="Calle y número"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Ciudad"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        required
                      />
                      <Input
                        label="Provincia"
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Código postal"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                        required
                      />
                      <Input
                        label="Teléfono"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-small text-red-500">{error}</p>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" onClick={() => setStep("cart")}>
                    Volver
                  </Button>
                  <Button onClick={handleProceedToPayment}>
                    Continuar al pago
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-serif text-heading-xl text-gema-black mb-8">
                Pago
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-4">
                    Método de pago
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-4 p-4 border border-gema-gray-200 cursor-pointer hover:border-gema-black transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="mercadopago"
                        checked={paymentProvider === "mercadopago"}
                        onChange={() => setPaymentProvider("mercadopago")}
                        className="w-4 h-4"
                      />
                      <span className="text-body">MercadoPago</span>
                      <span className="text-small text-gema-gray-500 ml-auto">
                        Tarjetas, efectivo, transferencia
                      </span>
                    </label>

                    <label className="flex items-center gap-4 p-4 border border-gema-gray-200 cursor-pointer hover:border-gema-black transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={paymentProvider === "stripe"}
                        onChange={() => setPaymentProvider("stripe")}
                        className="w-4 h-4"
                      />
                      <span className="text-body">Stripe</span>
                      <span className="text-small text-gema-gray-500 ml-auto">
                        Tarjetas internacionales
                      </span>
                    </label>
                  </div>
                </div>

                {error && (
                  <p className="text-small text-red-500">{error}</p>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" onClick={() => setStep("info")}>
                    Volver
                  </Button>
                  <Button onClick={handlePayment} loading={loading}>
                    Pagar {formatCurrency(total)}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-gema-gray-50 p-8 sticky top-32">
          <h3 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-6">
            Resumen
          </h3>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={`${item.bookId}-${item.format}`} className="flex justify-between text-small">
                <span className="text-gema-gray-600">
                  {item.book.title} ({item.format.toUpperCase()}) × {item.quantity}
                </span>
                <span className="text-gema-black">
                  {formatCurrency(getBookPrice(item.book, item.format) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gema-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-small">
              <span className="text-gema-gray-600">Subtotal</span>
              <span className="text-gema-black">{formatCurrency(subtotal)}</span>
            </div>

            {hasPrintItems && (
              <div className="flex justify-between text-small">
                <span className="text-gema-gray-600">Envío</span>
                <span className="text-gema-black">{formatCurrency(shippingCost)}</span>
              </div>
            )}

            <div className="flex justify-between text-body pt-2 border-t border-gema-gray-200">
              <span className="text-gema-black font-medium">Total</span>
              <span className="text-gema-black font-medium">{formatCurrency(total)}</span>
            </div>
          </div>

          {hasDigitalItems && (
            <p className="mt-6 text-caption text-gema-gray-500">
              Los libros digitales se enviarán a tu email inmediatamente después del pago.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
