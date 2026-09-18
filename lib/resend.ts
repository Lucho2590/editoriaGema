import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is not set
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || "GEMA <hola@editorialgema.com>",
  replyTo: process.env.RESEND_REPLY_TO || undefined,
};

export interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailParams) {
  const client = getResendClient();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      console.error("RESEND_API_KEY is not set; email not sent to:", to, "Subject:", subject);
      return { success: false, error: "RESEND_API_KEY is not set" };
    }
    console.log("Email would be sent to:", to, "Subject:", subject);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: emailConfig.from,
      to,
      subject,
      react,
      ...(emailConfig.replyTo && { reply_to: emailConfig.replyTo }),
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
