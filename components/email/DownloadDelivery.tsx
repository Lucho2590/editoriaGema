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
import { Order, DownloadLink } from "@/types";

interface DownloadDeliveryEmailProps {
  order: Order;
  downloadLinks: DownloadLink[];
}

export function DownloadDeliveryEmail({ order, downloadLinks }: DownloadDeliveryEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com";

  // Group downloads by book
  const bookDownloads = order.items
    .filter((item) => item.format === "pdf" || item.format === "epub")
    .map((item) => {
      const link = downloadLinks.find(
        (l) => l.bookId === item.bookId && l.format === item.format
      );
      return {
        ...item,
        downloadUrl: link?.url,
      };
    });

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
            <Text style={heading}>Tus libros están listos</Text>
            <Text style={paragraph}>
              Aquí están los enlaces de descarga para los libros digitales de tu pedido.
              Los enlaces son válidos por 7 días y permiten hasta 5 descargas cada uno.
            </Text>

            <Section style={booksSection}>
              {bookDownloads.map((book, index) => (
                <Section key={index} style={bookCard}>
                  <Text style={bookTitle}>{book.bookTitle}</Text>
                  <Text style={bookAuthor}>{book.bookAuthor}</Text>
                  <Text style={bookFormat}>{book.format.toUpperCase()}</Text>

                  {book.downloadUrl ? (
                    <Button href={book.downloadUrl} style={downloadButton}>
                      Descargar {book.format.toUpperCase()}
                    </Button>
                  ) : (
                    <Text style={errorText}>
                      Enlace no disponible. Contacta a soporte.
                    </Text>
                  )}
                </Section>
              ))}
            </Section>

            <Section style={noticeSection}>
              <Text style={notice}>
                También puedes acceder a tus libros en cualquier momento desde tu{" "}
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
              ¿Problemas con la descarga? Escríbenos a{" "}
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
  marginBottom: "32px",
};

const booksSection = {
  marginBottom: "24px",
};

const bookCard = {
  padding: "24px",
  backgroundColor: "#f7f7f7",
  borderRadius: "2px",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const bookTitle = {
  fontSize: "18px",
  fontWeight: "400",
  color: "#0a0a0a",
  margin: "0 0 4px 0",
};

const bookAuthor = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 8px 0",
};

const bookFormat = {
  fontSize: "11px",
  letterSpacing: "0.1em",
  color: "#818181",
  margin: "0 0 16px 0",
};

const downloadButton = {
  backgroundColor: "#0a0a0a",
  color: "#ffffff",
  padding: "12px 24px",
  fontSize: "13px",
  fontWeight: "500",
  letterSpacing: "0.05em",
  textDecoration: "none",
  textTransform: "uppercase" as const,
  borderRadius: "2px",
};

const errorText = {
  fontSize: "13px",
  color: "#dc2626",
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
