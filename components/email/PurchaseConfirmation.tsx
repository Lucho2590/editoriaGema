import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from "@react-email/components";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface PurchaseConfirmationEmailProps {
  order: Order;
}

export function PurchaseConfirmationEmail({ order }: PurchaseConfirmationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>GEMA</Text>
            <Text style={tagline}>Generadora de Escrituras y Manifiestos Artísticos</Text>
          </Section>

          <Hr style={divider} />

          <Section style={content}>
            <Text style={heading}>Gracias por tu compra</Text>
            <Text style={paragraph}>
              Hemos recibido tu pedido correctamente. A continuación encontrarás los detalles de tu compra.
            </Text>

            <Text style={orderNumber}>
              Pedido #{order.id.slice(-6).toUpperCase()}
            </Text>

            <Section style={itemsSection}>
              {order.items.map((item, index) => (
                <Section key={index} style={itemRow}>
                  <Text style={itemTitle}>
                    {item.bookTitle}
                  </Text>
                  <Text style={itemDetails}>
                    {item.bookAuthor} · {item.format.toUpperCase()} · {formatCurrency(item.price)}
                  </Text>
                </Section>
              ))}
            </Section>

            <Hr style={dividerLight} />

            <Section style={totalsSection}>
              <Text style={totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </Text>
              {order.shippingCost > 0 && (
                <Text style={totalRow}>
                  <span>Envío</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </Text>
              )}
              <Text style={totalRowFinal}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </Text>
            </Section>

            {order.hasDigitalItems && (
              <Section style={noticeSection}>
                <Text style={notice}>
                  Si compraste libros digitales, recibirás un email separado con los enlaces de descarga.
                </Text>
              </Section>
            )}

            {order.hasPrintItems && order.shippingAddress && (
              <Section style={addressSection}>
                <Text style={addressHeading}>Dirección de envío</Text>
                <Text style={addressText}>
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </Text>
              </Section>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              ¿Preguntas? Escríbenos a{" "}
              <Link href="mailto:contacto@gema-editorial.com" style={link}>
                contacto@gema-editorial.com
              </Link>
            </Text>
            <Text style={footerLinks}>
              <Link href={appUrl} style={link}>
                gema-editorial.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#fafafa",
  fontFamily: "Georgia, Times New Roman, serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  fontSize: "28px",
  fontWeight: "400",
  letterSpacing: "0.15em",
  color: "#0a0a0a",
  margin: "0",
};

const tagline = {
  fontSize: "11px",
  letterSpacing: "0.1em",
  color: "#666666",
  marginTop: "8px",
  textTransform: "uppercase" as const,
};

const divider = {
  borderColor: "#e3e3e3",
  margin: "32px 0",
};

const dividerLight = {
  borderColor: "#e3e3e3",
  margin: "24px 0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "2px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "400",
  color: "#0a0a0a",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#434343",
  marginBottom: "24px",
};

const orderNumber = {
  fontSize: "13px",
  letterSpacing: "0.05em",
  color: "#666666",
  marginBottom: "24px",
};

const itemsSection = {
  marginBottom: "0",
};

const itemRow = {
  marginBottom: "16px",
};

const itemTitle = {
  fontSize: "16px",
  fontWeight: "400",
  color: "#0a0a0a",
  margin: "0 0 4px 0",
};

const itemDetails = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
};

const totalsSection = {
  marginTop: "0",
};

const totalRow = {
  fontSize: "14px",
  color: "#434343",
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const totalRowFinal = {
  fontSize: "16px",
  fontWeight: "500",
  color: "#0a0a0a",
  display: "flex",
  justifyContent: "space-between",
  marginTop: "16px",
};

const noticeSection = {
  marginTop: "24px",
  padding: "16px",
  backgroundColor: "#f7f7f7",
  borderRadius: "2px",
};

const notice = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
  lineHeight: "1.5",
};

const addressSection = {
  marginTop: "24px",
};

const addressHeading = {
  fontSize: "12px",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  color: "#666666",
  marginBottom: "8px",
};

const addressText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#434343",
  margin: "0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "13px",
  color: "#666666",
  marginBottom: "8px",
};

const footerLinks = {
  fontSize: "13px",
  color: "#666666",
};

const link = {
  color: "#0a0a0a",
  textDecoration: "underline",
};
