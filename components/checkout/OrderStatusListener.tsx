"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/hooks/useCart";
import { checkPaymentStatus } from "@/server/actions/payments";
import type { PaymentStatus } from "@/types";

interface Props {
  orderId: string;
  initialStatus: PaymentStatus;
  clearCartWhenCompleted?: boolean;
  onStatus?: (status: PaymentStatus) => void;
}

export function OrderStatusListener({
  orderId,
  initialStatus,
  clearCartWhenCompleted = false,
  onStatus,
}: Props) {
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const polledRef = useRef(false);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (clearCartWhenCompleted && status === "completed" && !clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
    onStatus?.(status);
  }, [status, clearCartWhenCompleted, clearCart, onStatus]);

  useEffect(() => {
    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { paymentStatus?: PaymentStatus };
        if (data.paymentStatus) setStatus(data.paymentStatus);
      },
      (err) => {
        console.error("OrderStatusListener snapshot error:", err);
      }
    );

    const timer = setTimeout(async () => {
      if (polledRef.current) return;
      polledRef.current = true;
      if (status === "pending" || status === "processing") {
        try {
          await checkPaymentStatus(orderId);
        } catch (err) {
          console.error("checkPaymentStatus failed:", err);
        }
      }
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return null;
}
