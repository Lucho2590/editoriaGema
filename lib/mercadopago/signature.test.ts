import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import {
  parseSignatureHeader,
  buildManifest,
  computeSignature,
  verifyWebhookSignature,
} from "./signature.ts";

test("parseSignatureHeader parses ts and v1", () => {
  const parts = parseSignatureHeader("ts=1700000000,v1=abc123");
  assert.deepEqual(parts, { ts: "1700000000", v1: "abc123" });
});

test("parseSignatureHeader trims whitespace", () => {
  const parts = parseSignatureHeader("ts=1700000000 , v1=abc123");
  assert.deepEqual(parts, { ts: "1700000000", v1: "abc123" });
});

test("parseSignatureHeader returns null on malformed input", () => {
  assert.equal(parseSignatureHeader(null), null);
  assert.equal(parseSignatureHeader(""), null);
  assert.equal(parseSignatureHeader("ts=123"), null);
  assert.equal(parseSignatureHeader("nope"), null);
});

test("buildManifest lowercases dataId and follows exact format", () => {
  const m = buildManifest("ABC-123", "req-xyz", "1700000000");
  assert.equal(m, "id:abc-123;request-id:req-xyz;ts:1700000000;");
});

test("verifyWebhookSignature accepts a valid signature", () => {
  const secret = "test-secret";
  const dataId = "123456789";
  const xRequestId = "req-1";
  const ts = "1700000000";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  const valid = verifyWebhookSignature({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId,
    dataId,
    secret,
  });
  assert.equal(valid, true);
});

test("verifyWebhookSignature rejects a tampered signature", () => {
  const valid = verifyWebhookSignature({
    xSignature: "ts=1700000000,v1=deadbeefdeadbeefdeadbeefdeadbeef",
    xRequestId: "req-1",
    dataId: "123456789",
    secret: "test-secret",
  });
  assert.equal(valid, false);
});

test("verifyWebhookSignature rejects wrong secret", () => {
  const secret = "test-secret";
  const dataId = "123456789";
  const xRequestId = "req-1";
  const ts = "1700000000";
  const manifest = buildManifest(dataId, xRequestId, ts);
  const v1 = computeSignature(manifest, secret);

  const valid = verifyWebhookSignature({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId,
    dataId,
    secret: "wrong-secret",
  });
  assert.equal(valid, false);
});

test("verifyWebhookSignature rejects missing requestId", () => {
  const valid = verifyWebhookSignature({
    xSignature: "ts=1700000000,v1=abc",
    xRequestId: null,
    dataId: "123",
    secret: "s",
  });
  assert.equal(valid, false);
});

test("verifyWebhookSignature handles uppercase dataId by lowercasing in manifest", () => {
  const secret = "s";
  const dataId = "ABC123";
  const xRequestId = "r";
  const ts = "1";
  const v1 = computeSignature(buildManifest(dataId, xRequestId, ts), secret);

  const valid = verifyWebhookSignature({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId,
    dataId: "ABC123",
    secret,
  });
  assert.equal(valid, true);
});
