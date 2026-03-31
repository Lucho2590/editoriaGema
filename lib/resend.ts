import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is not set
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_CHECKOUT_BOOK || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || "GEMA <hola@gema-editorial.com>",
  replyTo: "contacto@gema-editorial.com",
};

export interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailParams) {
  const client = getResendClient();

  if (!client) {
    console.log("Email would be sent to:", to, "Subject:", subject);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: emailConfig.from,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// Export for backwards compatibility - may be null if API key not configured
export const resend = getResendClient();
