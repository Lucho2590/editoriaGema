import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Button,
} from "@react-email/components";

interface AdminInvitationEmailProps {
  email: string;
  displayName?: string;
  resetPasswordLink: string;
}

export function AdminInvitationEmail({
  email,
  displayName,
  resetPasswordLink,
}: AdminInvitationEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";
  const adminUrl = `${appUrl}/admin`;

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
            <Text style={heading}>Bienvenido/a al equipo</Text>
            <Text style={paragraph}>
              {displayName ? `Hola ${displayName},` : "Hola,"}<br /><br />
              Se te ha dado acceso como administrador/a al panel de GEMA Editorial.
            </Text>

            <Section style={credentialsSection}>
              <Text style={credentialsHeading}>Tu cuenta</Text>
              <Text style={credentialsText}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={paragraph}>
                Para acceder, primero deberás establecer tu contraseña haciendo clic en el siguiente enlace:
              </Text>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={resetPasswordLink}>
                Establecer contraseña
              </Button>
            </Section>

            <Text style={paragraphSmall}>
              Una vez que hayas establecido tu contraseña, podrás acceder al panel de administración en:{" "}
              <Link href={adminUrl} style={link}>
                {adminUrl}
              </Link>
            </Text>

            <Section style={noticeSection}>
              <Text style={notice}>
                Este enlace expirará en 1 hora por seguridad. Si no solicitaste este acceso, puedes ignorar este email.
              </Text>
            </Section>
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

const paragraphSmall = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#434343",
  marginBottom: "24px",
};

const credentialsSection = {
  marginBottom: "24px",
  padding: "20px",
  backgroundColor: "#f7f7f7",
  borderRadius: "2px",
};

const credentialsHeading = {
  fontSize: "12px",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  color: "#666666",
  marginBottom: "12px",
  marginTop: "0",
};

const credentialsText = {
  fontSize: "15px",
  color: "#0a0a0a",
  margin: "0 0 16px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#0a0a0a",
  color: "#ffffff",
  padding: "14px 32px",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  borderRadius: "2px",
  display: "inline-block",
};

const noticeSection = {
  marginTop: "24px",
  padding: "16px",
  backgroundColor: "#fff8e6",
  borderRadius: "2px",
};

const notice = {
  fontSize: "13px",
  color: "#8a6d00",
  margin: "0",
  lineHeight: "1.5",
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
