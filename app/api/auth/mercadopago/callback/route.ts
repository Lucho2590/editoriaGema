import { NextRequest, NextResponse } from "next/server";
import { saveMercadoPagoSettings } from "@/server/actions/settings";

const MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!appUrl || !clientId || !clientSecret) {
    return errorRedirect(appUrl, "config_missing");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return errorRedirect(appUrl, error);
  }

  if (!code || !state) {
    return errorRedirect(appUrl, "missing_params");
  }

  const stateCookie = request.cookies.get("mp_oauth_state")?.value;
  if (!stateCookie || stateCookie !== state) {
    return errorRedirect(appUrl, "invalid_state");
  }

  const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;

  try {
    const tokenResponse = await fetch(MP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error("MP token exchange failed:", tokenResponse.status, text);
      return errorRedirect(appUrl, "token_exchange_failed");
    }

    const data = await tokenResponse.json();

    const result = await saveMercadoPagoSettings({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      publicKey: data.public_key,
      userId: data.user_id,
      liveMode: data.live_mode ?? true,
      expiresInSeconds: data.expires_in,
    });

    if (!result.success) {
      return errorRedirect(appUrl, "save_failed");
    }

    const response = NextResponse.redirect(`${appUrl}/admin/configuracion?status=connected`);
    response.cookies.delete("mp_oauth_state");
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return errorRedirect(appUrl, "internal_error");
  }
}

function errorRedirect(appUrl: string | undefined, reason: string) {
  const base = appUrl || "";
  return NextResponse.redirect(`${base}/admin/configuracion?status=error&reason=${encodeURIComponent(reason)}`);
}
