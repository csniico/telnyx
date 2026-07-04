import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./mongodb";
import type { Conversation, Direction, MessageDoc } from "./types";
import { decryptText, encryptText } from "./crypto";

async function messages(): Promise<Collection<MessageDoc>> {
  const db = await getDb();
  const col = db.collection<MessageDoc>("messages");
  // Idempotent: unique on telnyxId so webhook + send results dedupe/merge.
  await col.createIndex({ telnyxId: 1 }, { unique: true });
  await col.createIndex({ ourNumber: 1, contactNumber: 1, updatedAt: -1 });
  return col;
}

/** Upsert a message, keyed by Telnyx id. Used by webhooks and the send route. */
export async function upsertMessage(doc: MessageDoc): Promise<void> {
  const col = await messages();
  await col.updateOne(
    { telnyxId: doc.telnyxId },
    {
      $set: {
        direction: doc.direction,
        ourNumber: doc.ourNumber,
        contactNumber: doc.contactNumber,
        text: doc.text,
        mediaUrls: doc.mediaUrls,
        status: doc.status,
        messagingProfileId: doc.messagingProfileId,
        sentAt: doc.sentAt,
        receivedAt: doc.receivedAt,
        updatedAt: doc.updatedAt,
        raw: doc.raw,
      },
    },
    { upsert: true },
  );
}

/** Update just the delivery status of an existing message (status webhooks). */
export async function updateMessageStatus(
  telnyxId: string,
  status: string,
): Promise<void> {
  const col = await messages();
  await col.updateOne(
    { telnyxId },
    { $set: { status, updatedAt: new Date() } },
  );
}

/** Inbox: one row per (ourNumber, contactNumber) thread, most recent first. */
export async function listConversations(): Promise<Conversation[]> {
  const col = await messages();
  const rows = await col
    .aggregate<Conversation>([
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: { ourNumber: "$ourNumber", contactNumber: "$contactNumber" },
          ourNumber: { $first: "$ourNumber" },
          contactNumber: { $first: "$contactNumber" },
          lastText: { $first: "$text" },
          lastDirection: { $first: "$direction" },
          lastAt: { $first: "$updatedAt" },
          lastEncrypted: { $first: { $ifNull: ["$encrypted", false] } },
          lastCipherData: { $first: { $ifNull: ["$cipher.data", null] } },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastAt: -1 } },
      // Exclusion-only projection: drops _id but keeps every $group field.
      { $project: { _id: 0 } },
    ])
    .toArray();
  return rows;
}

// ---- Encryption ("soft delete") -------------------------------------------

/** Encrypt one message in place, replacing its plaintext with ciphertext. */
export async function encryptMessage(
  telnyxId: string,
  passcode: string,
): Promise<boolean> {
  const col = await messages();
  const doc = await col.findOne({ telnyxId });
  if (!doc) return false;
  if (doc.encrypted) return true; // already encrypted
  const cipher = encryptText(doc.text ?? "", passcode);
  await col.updateOne(
    { telnyxId },
    { $set: { encrypted: true, cipher, text: "", updatedAt: doc.updatedAt } },
  );
  return true;
}

/** Decrypt one message in place, restoring its plaintext. Throws on bad passcode. */
export async function decryptMessage(
  telnyxId: string,
  passcode: string,
): Promise<boolean> {
  const col = await messages();
  const doc = await col.findOne({ telnyxId });
  if (!doc) return false;
  if (!doc.encrypted || !doc.cipher) return true; // nothing to do
  const text = decryptText(doc.cipher, passcode); // throws if passcode wrong
  await col.updateOne(
    { telnyxId },
    { $set: { encrypted: false, cipher: null, text, updatedAt: doc.updatedAt } },
  );
  return true;
}

/** Encrypt every not-yet-encrypted message in a thread. Returns count changed. */
export async function encryptConversation(
  ourNumber: string,
  contactNumber: string,
  passcode: string,
): Promise<number> {
  const col = await messages();
  const docs = await col
    .find({ ourNumber, contactNumber, encrypted: { $ne: true } })
    .toArray();
  let n = 0;
  for (const doc of docs) {
    const cipher = encryptText(doc.text ?? "", passcode);
    await col.updateOne(
      { telnyxId: doc.telnyxId },
      { $set: { encrypted: true, cipher, text: "", updatedAt: doc.updatedAt } },
    );
    n++;
  }
  return n;
}

/** Decrypt every encrypted message in a thread. Throws on bad passcode. */
export async function decryptConversation(
  ourNumber: string,
  contactNumber: string,
  passcode: string,
): Promise<number> {
  const col = await messages();
  const docs = await col
    .find({ ourNumber, contactNumber, encrypted: true })
    .toArray();
  let n = 0;
  for (const doc of docs) {
    if (!doc.cipher) continue;
    const text = decryptText(doc.cipher, passcode); // throws if passcode wrong
    await col.updateOne(
      { telnyxId: doc.telnyxId },
      {
        $set: { encrypted: false, cipher: null, text, updatedAt: doc.updatedAt },
      },
    );
    n++;
  }
  return n;
}

/** All messages in a thread, oldest first (chat order). */
export async function getConversation(
  ourNumber: string,
  contactNumber: string,
): Promise<MessageDoc[]> {
  const col = await messages();
  return col
    .find({ ourNumber, contactNumber }, { projection: { _id: 0, raw: 0 } })
    .sort({ updatedAt: 1 })
    .toArray();
}

export interface NormalizedWebhook {
  telnyxId: string;
  direction: Direction;
  ourNumber: string;
  contactNumber: string;
  text: string;
  mediaUrls: string[];
  status: string;
  messagingProfileId: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
}

/**
 * Turn a Telnyx messaging webhook payload into a MessageDoc.
 * Handles message.received (inbound) and message.sent / message.finalized.
 */
export function normalizeWebhook(payload: any): NormalizedWebhook | null {
  if (!payload?.id) return null;

  const direction: Direction =
    payload.direction === "outbound" ? "outbound" : "inbound";

  const fromNumber: string = payload.from?.phone_number ?? "";
  const toEntry = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  const toNumber: string = toEntry?.phone_number ?? "";

  // Inbound: the external party is `from`, our number is `to`.
  // Outbound: the external party is `to`, our number is `from`.
  const ourNumber = direction === "inbound" ? toNumber : fromNumber;
  const contactNumber = direction === "inbound" ? fromNumber : toNumber;

  const status: string =
    toEntry?.status ?? (direction === "inbound" ? "received" : "queued");

  const mediaUrls: string[] = Array.isArray(payload.media)
    ? payload.media.map((m: any) => m.url).filter(Boolean)
    : [];

  return {
    telnyxId: payload.id,
    direction,
    ourNumber,
    contactNumber,
    text: payload.text ?? "",
    mediaUrls,
    status,
    messagingProfileId: payload.messaging_profile_id ?? null,
    sentAt: payload.sent_at ? new Date(payload.sent_at) : null,
    receivedAt: payload.received_at ? new Date(payload.received_at) : null,
  };
}
