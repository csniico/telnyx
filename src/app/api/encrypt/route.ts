import { NextResponse } from "next/server";
import { isValidPasscode } from "@/lib/crypto";
import {
  encryptMessage,
  decryptMessage,
  encryptConversation,
  decryptConversation,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const action: "encrypt" | "decrypt" = body.action;
  const target: "message" | "conversation" = body.target;
  const passcode: string = body.passcode ?? "";

  if (action !== "encrypt" && action !== "decrypt") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  if (target !== "message" && target !== "conversation") {
    return NextResponse.json({ error: "invalid target" }, { status: 400 });
  }
  if (!isValidPasscode(passcode)) {
    return NextResponse.json({ error: "incorrect passcode" }, { status: 401 });
  }

  try {
    if (target === "message") {
      const telnyxId: string = body.telnyxId;
      if (!telnyxId) {
        return NextResponse.json({ error: "telnyxId required" }, { status: 400 });
      }
      const ok =
        action === "encrypt"
          ? await encryptMessage(telnyxId, passcode)
          : await decryptMessage(telnyxId, passcode);
      if (!ok) {
        return NextResponse.json({ error: "message not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    // target === "conversation"
    const ourNumber: string = body.ourNumber;
    const contactNumber: string = body.contactNumber;
    if (!ourNumber || !contactNumber) {
      return NextResponse.json(
        { error: "ourNumber and contactNumber required" },
        { status: 400 },
      );
    }
    const count =
      action === "encrypt"
        ? await encryptConversation(ourNumber, contactNumber, passcode)
        : await decryptConversation(ourNumber, contactNumber, passcode);
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    // Most likely a GCM auth failure (wrong passcode for existing ciphertext).
    console.error("Encrypt/decrypt failed:", err);
    return NextResponse.json(
      { error: "operation failed — passcode may be incorrect" },
      { status: 400 },
    );
  }
}
