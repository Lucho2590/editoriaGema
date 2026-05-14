import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TransferSubmittedNotificationProps {
  order: Order;
}

export function TransferSubmittedNotification({ order }: TransferSubmittedNotificationProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";
  const td = order.transferDetails;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>GEMA ADMIN</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Transferencia pendiente de validación</Text>

            <Section style={detailsSection}>
              <Text style={detailLabel}>Pedido</Text>
              <Text style={detailValue}>#{order.id.slice(-6).toUpperCase()}</Text>

              <Text style={detailLabel}>Cliente</Text>
              <Text style={detailValue}>{order.userEmail}</Text>

              <Text style={detailLabel}>Total a verificar</Text>
              <Text style={detailValue}>{formatCurrency(order.total)}</Text>
            </Section>

            {td && (
              <>
                <Hr style={divider} />
                <Section style={detailsSection}>
                  <Text style={sectionTitle}>Datos del comprador</Text>
                  <Text style={detailLabel}>Nombre</Text>
                  <Text style={detailValue}>{td.buyerName}</Text>
                  <Text style={detailLabel}>DNI</Text>
                  <Text style={detailValue}>{td.buyerDni}</Text>
                  <Text style={detailLabel}>Teléfono</Text>
                  <Text style={detailValue}>{td.buyerPhone}</Text>
                  <Text style={detailLabel}>Banco / cuenta de origen</Text>
                  <Text style={detailValue}>
                    {td.buyerBank} — {td.buyerAccount}
                  </Text>
                  {td.receiptUrl && (
                    <>
                      <Text style={detailLabel}>Comprobante</Text>
                      <Link href={td.receiptUrl} style={inlineLink}>
                        Ver comprobante
                      </Link>
                    </>
                  )}
                </Section>
              </>
            )}

            <Section style={actionSection}>
              <Link href={`${appUrl}/admin/pedidos`} style={actionButton}>
                Revisar en el panel
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: "Helvetica Neue, Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "480px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo = {
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "0.2em",
  color: "#666666",
  margin: "0",
};

const content = {
  backgroundColor: "#171717",
  padding: "32px",
  borderRadius: "4px",
  border: "1px solid #333333",
};

const heading = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#ffffff",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const divider = {
  borderColor: "#333333",
  margin: "24px 0",
};

const detailsSection = {
  marginBottom: "0",
};

const sectionTitle = {
  fontSize: "11px",
  letterSpacing: "0.05em",
  color: "#666666",
  textTransform: "uppercase" as const,
  margin: "0 0 12px 0",
};

const detailLabel = {
  fontSize: "11px",
  letterSpacing: "0.05em",
  color: "#666666",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
};

const detailValue = {
  fontSize: "14px",
  color: "#ffffff",
  margin: "0 0 16px 0",
};

const inlineLink = {
  fontSize: "13px",
  color: "#ffffff",
  textDecoration: "underline",
};

const actionSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const actionButton = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  padding: "10px 20px",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "0.05em",
  textDecoration: "none",
  textTransform: "uppercase" as const,
  borderRadius: "2px",
};
