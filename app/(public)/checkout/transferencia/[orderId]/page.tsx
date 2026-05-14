import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { getOrder } from "@/server/actions/orders";
import { getTransferSettings } from "@/server/actions/settings";
import { TransferDetailsForm } from "@/components/checkout/TransferDetailsForm";
import { CopyableField } from "@/components/checkout/CopyableField";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pago por transferencia",
  description: "Completa los datos de tu transferencia bancaria.",
};

export default async function CheckoutTransferenciaPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  if (order.paymentProvider !== "transfer") {
    redirect(`/checkout/success?external_reference=${orderId}`);
  }

  if (order.paymentStatus === "completed") {
    redirect(`/checkout/success?external_reference=${orderId}`);
  }

  const settings = await getTransferSettings();
  if (!settings || !settings.enabled) {
    return (
      <div className="page-transition">
        <section className="section">
          <div className="max-w-content mx-auto text-center">
            <h1 className="font-serif text-heading-xl text-gema-black mb-4">
              Transferencia no disponible
            </h1>
            <p className="text-body text-gema-gray-500">
              Por favor contactanos para coordinar el pago.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // If buyer already submitted details, send them to /checkout/pending.
  if (order.transferDetails) {
    redirect(`/checkout/pending?external_reference=${orderId}&method=transfer`);
  }

  return (
    <div className="page-transition">
      <section className="section">
        <div className="max-w-content mx-auto">
          <div className="mb-12">
            <h1 className="font-serif text-heading-xl text-gema-black mb-3">
              Pago por transferencia
            </h1>
            <p className="text-body text-gema-gray-500">
              Pedido #{order.id.slice(-6).toUpperCase()} ·{" "}
              <span className="text-gema-black">Total a transferir: {formatCurrency(order.total)}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Datos bancarios */}
            <div>
              <h2 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-6">
                1. Realizá la transferencia
              </h2>

              <div className="space-y-3 mb-8">
                <CopyableField label="Banco" value={settings.bankName} />
                <CopyableField label="Titular" value={settings.accountHolder} />
                {settings.cuitCuil && (
                  <CopyableField label="CUIT / CUIL" value={settings.cuitCuil} />
                )}
                {settings.cbu && <CopyableField label="CBU" value={settings.cbu} />}
                {settings.alias && (
                  <CopyableField label="Alias" value={settings.alias} />
                )}
                <CopyableField
                  label="Importe"
                  value={formatCurrency(order.total)}
                  copyValue={String(order.total)}
                />
                <CopyableField
                  label="Referencia"
                  value={`#${order.id.slice(-6).toUpperCase()}`}
                />
              </div>

              {settings.instructions && (
                <div className="p-4 bg-gema-gray-50 border-l-2 border-gema-black mb-6">
                  <p className="text-small text-gema-gray-700 whitespace-pre-line">
                    {settings.instructions}
                  </p>
                </div>
              )}

              {settings.contactEmail && (
                <div className="flex items-start gap-3 text-small text-gema-gray-600">
                  <Mail size={16} className="mt-0.5 shrink-0" />
                  <span>
                    También podés enviar el comprobante a{" "}
                    <a
                      href={`mailto:${settings.contactEmail}?subject=Comprobante%20pedido%20%23${order.id.slice(-6).toUpperCase()}`}
                      className="underline text-gema-black"
                    >
                      {settings.contactEmail}
                    </a>
                  </span>
                </div>
              )}
            </div>

            {/* Form datos del comprador */}
            <div>
              <h2 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-6">
                2. Confirmá tus datos
              </h2>
              <p className="text-small text-gema-gray-500 mb-6">
                Cargá los datos desde donde transferís. Opcionalmente, subí el comprobante para
                que validemos tu pago más rápido.
              </p>
              <TransferDetailsForm orderId={order.id} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
