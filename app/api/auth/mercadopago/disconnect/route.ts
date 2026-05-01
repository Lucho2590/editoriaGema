import { NextResponse } from "next/server";
import { disconnectMercadoPago } from "@/server/actions/settings";

export async function POST() {
  const result = await disconnectMercadoPago();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
