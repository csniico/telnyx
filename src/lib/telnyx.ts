import "server-only";
import crypto from "node:crypto";
import { env } from "./env";
import type { MessagingProfile, PhoneNumber } from "./types";

const BASE_URL = "https://api.telnyx.com/v2";

async function telnyxFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.telnyxApiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // These are admin data reads/writes; never cache them.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telnyx ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

// ---- Reads ----------------------------------------------------------------

export async function listMessagingProfiles(): Promise<MessagingProfile[]> {
  const json = await telnyxFetch<{ data: MessagingProfile[] }>(
    "/messaging_profiles?page[size]=100",
  );
  return json.data;
}

export async function listProfilePhoneNumbers(
  profileId: string,
): Promise<PhoneNumber[]> {
  const json = await telnyxFetch<{ data: PhoneNumber[] }>(
    `/messaging_profiles/${profileId}/phone_numbers?page[size]=100`,
  );
  return json.data;
}

export async function listMessagingNumbers(): Promise<PhoneNumber[]> {
  const json = await telnyxFetch<{ data: PhoneNumber[] }>(
    "/phone_numbers/messaging?page[size]=100",
  );
  return json.data;
}

// ---- Send -----------------------------------------------------------------

export interface SendMessageInput {
  to: string;
  text: string;
  /** Provide either a specific `from` number OR a messaging profile (number pool). */
  from?: string;
  messagingProfileId?: string;
  mediaUrls?: string[];
}

export interface SendMessageResult {
  id: string;
  from: string;
  to: string;
  text: string;
  status: string;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const body: Record<string, unknown> = {
    to: input.to,
    text: input.text,
  };
  if (input.from) body.from = input.from;
  if (input.messagingProfileId) body.messaging_profile_id = input.messagingProfileId;
  if (input.mediaUrls?.length) body.media_urls = input.mediaUrls;

  const json = await telnyxFetch<{ data: any }>("/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const d = json.data;
  return {
    id: d.id,
    from: d.from?.phone_number ?? input.from ?? "",
    to: Array.isArray(d.to) ? d.to[0]?.phone_number : input.to,
    text: d.text ?? input.text,
    status: Array.isArray(d.to) ? (d.to[0]?.status ?? "queued") : "queued",
  };
}

// ---- Webhook signature verification (Ed25519) -----------------------------

/**
 * Telnyx signs `${timestamp}|${rawBody}` with Ed25519 and sends:
 *   telnyx-signature-ed25519: <base64 signature>
 *   telnyx-timestamp:         <unix seconds>
 * The public key (base64, 32 raw bytes) comes from Mission Control.
 */
export function verifyWebhookSignature(args: {
  rawBody: string;
  signatureB64: string | null;
  timestamp: string | null;
}): { valid: boolean; reason?: string } {
  const { rawBody, signatureB64, timestamp } = args;

  if (!env.telnyxPublicKey) {
    return { valid: false, reason: "TELNYX_PUBLIC_KEY not configured" };
  }
  if (!signatureB64 || !timestamp) {
    return { valid: false, reason: "missing signature or timestamp header" };
  }

  // Replay protection: reject stale timestamps.
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(ageSeconds) || Math.abs(ageSeconds) > env.webhookToleranceSeconds) {
    return { valid: false, reason: "timestamp outside tolerance window" };
  }

  try {
    // Wrap the raw 32-byte Ed25519 public key in a DER SPKI header so Node's
    // crypto can consume it.
    const rawKey = Buffer.from(env.telnyxPublicKey, "base64");
    const der = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      rawKey,
    ]);
    const publicKey = crypto.createPublicKey({
      key: der,
      format: "der",
      type: "spki",
    });

    const signedPayload = Buffer.from(`${timestamp}|${rawBody}`, "utf8");
    const signature = Buffer.from(signatureB64, "base64");
    const valid = crypto.verify(null, signedPayload, publicKey, signature);
    return valid ? { valid: true } : { valid: false, reason: "signature mismatch" };
  } catch (err) {
    return { valid: false, reason: `verification error: ${String(err)}` };
  }
}
