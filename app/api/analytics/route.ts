import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { AnalyticsEventInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEventInput = await request.json();

    // Validate required fields
    if (!event.type || !event.sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add event to Firestore
    await adminDb.collection("analytics_events").add({
      ...event,
      userAgent: request.headers.get("user-agent") || undefined,
      timestamp: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
