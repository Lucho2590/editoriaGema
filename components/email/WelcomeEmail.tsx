import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from "@react-email/components";

interface WelcomeEmailProps {
  displayName?: string;
}

export function WelcomeEmail({ displayName }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";
  const greeting = displayName ? `Hola ${displayName}` : "Hola";

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
              Bienvenido/a a GEMA. Ahora formas parte de una comunidad dedicada
              a la escritura y el pensamiento artístico.
            </Text>

            <Text style={paragraph}>
              En tu cuenta vas a encontrar nuestro catálogo completo de ensayos,
              manifiestos y obras artísticas, disponibles en formato digital e impreso.
            </Text>

            <Section style={ctaSection}>
              <Button href={`${appUrl}/catalogo`} style={ctaButton}>
                Explorar catálogo
              </Button>
            </Section>

            <Section style={noticeSection}>
              <Text style={notice}>
                Si comprás libros digitales, vas a poder acceder a ellos en cualquier
                momento desde tu{" "}
                <Link href={`${appUrl}/mi-biblioteca`} style={link}>
                  biblioteca personal
                </Link>
                .
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

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const ctaButton = {
  backgroundColor: "#0a0a0a",
  color: "#ffffff",
  padding: "14px 32px",
  fontSize: "13px",
  fontWeight: "500",
  letterSpacing: "0.05em",
  textDecoration: "none",
  textTransform: "uppercase" as const,
  borderRadius: "2px",
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
