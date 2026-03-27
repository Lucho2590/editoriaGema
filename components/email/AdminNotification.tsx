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

interface AdminNotificationEmailProps {
  order: Order;
}

export function AdminNotificationEmail({ order }: AdminNotificationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>GEMA ADMIN</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Nueva Venta</Text>

            <Section style={statsRow}>
              <Section style={statBox}>
                <Text style={statValue}>{formatCurrency(order.total)}</Text>
                <Text style={statLabel}>Total</Text>
              </Section>
              <Section style={statBox}>
                <Text style={statValue}>{order.items.length}</Text>
                <Text style={statLabel}>Items</Text>
              </Section>
              <Section style={statBox}>
                <Text style={statValue}>{order.paymentProvider.toUpperCase()}</Text>
                <Text style={statLabel}>Método</Text>
              </Section>
            </Section>

            <Hr style={divider} />

            <Section style={detailsSection}>
              <Text style={detailLabel}>Pedido</Text>
              <Text style={detailValue}>#{order.id.slice(-6).toUpperCase()}</Text>

              <Text style={detailLabel}>Cliente</Text>
              <Text style={detailValue}>{order.userEmail}</Text>

              <Text style={detailLabel}>Tipo</Text>
              <Text style={detailValue}>
                {order.hasDigitalItems && "Digital"}
                {order.hasDigitalItems && order.hasPrintItems && " + "}
                {order.hasPrintItems && "Impreso"}
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={itemsSection}>
              <Text style={sectionTitle}>Items</Text>
              {order.items.map((item, index) => (
                <Text key={index} style={itemRow}>
                  {item.bookTitle} ({item.format.toUpperCase()}) — {formatCurrency(item.price)}
                </Text>
              ))}
            </Section>

            {order.hasPrintItems && order.shippingAddress && (
              <>
                <Hr style={divider} />
                <Section style={itemsSection}>
                  <Text style={sectionTitle}>Envío</Text>
                  <Text style={addressText}>
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                    {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                  </Text>
                </Section>
              </>
            )}

            <Section style={actionSection}>
              <Link href={`${appUrl}/admin/pedidos`} style={actionButton}>
                Ver en Dashboard
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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
  fontSize: "20px",
  fontWeight: "500",
  color: "#ffffff",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const statsRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "24px",
};

const statBox = {
  textAlign: "center" as const,
  flex: "1",
};

const statValue = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#ffffff",
  margin: "0 0 4px 0",
};

const statLabel = {
  fontSize: "11px",
  letterSpacing: "0.05em",
  color: "#666666",
  textTransform: "uppercase" as const,
  margin: "0",
};

const divider = {
  borderColor: "#333333",
  margin: "24px 0",
};

const detailsSection = {
  marginBottom: "0",
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

const itemsSection = {
  marginBottom: "0",
};

const sectionTitle = {
  fontSize: "11px",
  letterSpacing: "0.05em",
  color: "#666666",
  textTransform: "uppercase" as const,
  margin: "0 0 12px 0",
};

const itemRow = {
  fontSize: "13px",
  color: "#a4a4a4",
  margin: "0 0 8px 0",
};

const addressText = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#a4a4a4",
  margin: "0",
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
