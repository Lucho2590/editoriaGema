import { NextRequest, NextResponse } from "next/server";
import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
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

    const eventData = {
      ...event,
      userAgent: request.headers.get("user-agent") || undefined,
    };

    // Use admin SDK if available, otherwise client SDK
    if (isAdminReady && adminDb) {
      await adminDb.collection("analytics_events").add({
        ...eventData,
        timestamp: Timestamp.now(),
      });
    } else {
      await addDoc(collection(db, "analytics_events"), {
        ...eventData,
        timestamp: ClientTimestamp.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
