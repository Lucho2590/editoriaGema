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
import { formatCurrency } from "@/lib/utils";

interface TicketEmailProps {
  code: string;
  eventTitle: string;
  eventDate: string; // pre-formatted
  eventLocation: string;
  buyerName?: string;
  price: number;
  qrDataUrl: string;
}

export function TicketEmail({
  code,
  eventTitle,
  eventDate,
  eventLocation,
  buyerName,
  price,
  qrDataUrl,
}: TicketEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";
  const greeting = buyerName ? `Hola ${buyerName}` : "Hola";

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
            <Text style={heading}>{greeting}</Text>
            <Text style={paragraph}>
              Tu entrada para <strong>{eventTitle}</strong> está confirmada. Presentá este código o el QR al ingresar al evento.
            </Text>

            <Section style={codeSection}>
              <Text style={codeLabel}>TU CÓDIGO DE ENTRADA</Text>
              <Text style={codeValue}>{code}</Text>
            </Section>

            <Section style={qrSection}>
              <Img src={qrDataUrl} alt={`QR code: ${code}`} width="200" height="200" style={qrImage} />
            </Section>

            <Hr style={dividerLight} />

            <Section style={detailsSection}>
              <Text style={detailLabel}>EVENTO</Text>
              <Text style={detailValue}>{eventTitle}</Text>

              <Text style={detailLabel}>FECHA</Text>
              <Text style={detailValue}>{eventDate}</Text>

              <Text style={detailLabel}>LUGAR</Text>
              <Text style={detailValue}>{eventLocation}</Text>

              <Text style={detailLabel}>PRECIO</Text>
              <Text style={detailValue}>{formatCurrency(price)}</Text>
            </Section>

            <Section style={noticeSection}>
              <Text style={notice}>
                Esta entrada es personal e intransferible. No compartas tu código con nadie.
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              ¿Preguntas? Escribinos a{" "}
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

const codeSection = {
  textAlign: "center" as const,
  padding: "24px",
  backgroundColor: "#0a0a0a",
  borderRadius: "4px",
  marginBottom: "24px",
};

const codeLabel = {
  fontSize: "11px",
  letterSpacing: "0.15em",
  color: "#999999",
  margin: "0 0 8px 0",
};

const codeValue = {
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "0.3em",
  color: "#ffffff",
  margin: "0",
  fontFamily: "monospace, Courier New, Courier",
};

const qrSection = {
  textAlign: "center" as const,
  marginBottom: "8px",
};

const qrImage = {
  margin: "0 auto",
  borderRadius: "4px",
};

const detailsSection = {
  marginBottom: "24px",
};

const detailLabel = {
  fontSize: "11px",
  letterSpacing: "0.1em",
  color: "#999999",
  margin: "16px 0 4px 0",
  textTransform: "uppercase" as const,
};

const detailValue = {
  fontSize: "15px",
  color: "#0a0a0a",
  margin: "0",
};

const noticeSection = {
  padding: "16px",
  backgroundColor: "#f7f7f7",
  borderRadius: "2px",
};

const notice = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
  lineHeight: "1.5",
  textAlign: "center" as const,
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
