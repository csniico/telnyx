import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/telnyx";
import { upsertMessage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const to: string | undefined = body.to;
  const text: string | undefined = body.text;
  const from: string | undefined = body.from;
  const messagingProfileId: string | undefined = body.messagingProfileId;
  const mediaUrls: string[] | undefined = body.mediaUrls;

  if (!to || !text) {
    return NextResponse.json(
      { error: "`to` and `text` are required" },
      { status: 400 },
    );
  }
  if (!from && !messagingProfileId) {
    return NextResponse.json(
      { error: "provide either `from` or `messagingProfileId`" },
      { status: 400 },
    );
  }

  try {
    const result = await sendMessage({ to, text, from, messagingProfileId, mediaUrls });

    // Optimistically persist the outbound message; delivery-status webhooks
    // will later upsert the same telnyxId with the final status.
    await upsertMessage({
      telnyxId: result.id,
      direction: "outbound",
      ourNumber: result.from,
      contactNumber: to,
      text,
      mediaUrls: mediaUrls ?? [],
      status: result.status,
      messagingProfileId: messagingProfileId ?? null,
      sentAt: new Date(),
      receivedAt: null,
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true, id: result.id, status: result.status });
  } catch (err) {
    console.error("Send failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "send failed" },
      { status: 502 },
    );
  }
}
