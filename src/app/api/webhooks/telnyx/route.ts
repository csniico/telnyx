import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/telnyx";
import { normalizeWebhook, upsertMessage } from "@/lib/store";
import { env } from "@/lib/env";

// Webhooks must run on the Node.js runtime (Ed25519 via node:crypto) and never
// be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Read the RAW body — signature is computed over the exact bytes.
  const rawBody = await req.text();
  const signatureB64 = req.headers.get("telnyx-signature-ed25519");
  const timestamp = req.headers.get("telnyx-timestamp");

  const { valid, reason } = verifyWebhookSignature({
    rawBody,
    signatureB64,
    timestamp,
  });

  if (!valid) {
    // In production a bad signature is a hard reject. In dev without a public
    // key configured we log and continue so you can test with tunnels.
    if (env.isProduction || env.telnyxPublicKey) {
      console.warn("Rejected Telnyx webhook:", reason);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    console.warn("Webhook signature not verified (dev):", reason);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType: string | undefined = event?.data?.event_type;
  const payload = event?.data?.payload;

  const normalized = payload ? normalizeWebhook(payload) : null;
  if (normalized) {
    await upsertMessage({
      ...normalized,
      updatedAt: new Date(),
      raw: payload,
    });
  } else {
    console.warn("Unhandled/empty webhook payload for event:", eventType);
  }

  // Ack fast so Telnyx doesn't retry.
  return NextResponse.json({ received: true });
}
