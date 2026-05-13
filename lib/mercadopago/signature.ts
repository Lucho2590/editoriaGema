import { createHmac, timingSafeEqual } from "crypto";

export interface SignatureParts {
  ts: string;
  v1: string;
}

export function parseSignatureHeader(header: string | null | undefined): SignatureParts | null {
  if (!header) return null;
  const parts: Record<string, string> = {};
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=", 2);
    if (k && v) parts[k.trim()] = v.trim();
  }
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

export function buildManifest(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
}

export function computeSignature(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function verifyWebhookSignature(input: {
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  dataId: string;
  secret: string;
}): boolean {
  const parts = parseSignatureHeader(input.xSignature);
  if (!parts) return false;
  if (!input.xRequestId) return false;

  const manifest = buildManifest(input.dataId, input.xRequestId, parts.ts);
  const expected = computeSignature(manifest, input.secret);

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parts.v1, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
