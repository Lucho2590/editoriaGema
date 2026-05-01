import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const MP_AUTHORIZATION_URL = "https://auth.mercadopago.com/authorization";

export async function GET(request: NextRequest) {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "MercadoPago OAuth not configured. Missing MERCADOPAGO_CLIENT_ID or NEXT_PUBLIC_APP_URL." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: redirectUri,
  });

  const authUrl = `${MP_AUTHORIZATION_URL}?${params.toString()}`;
  const response = NextResponse.redirect(authUrl);

  response.cookies.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
