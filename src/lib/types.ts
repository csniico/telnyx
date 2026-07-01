// Shared types. Safe to import from both server and client components
// (contains no secrets and no server-only imports).

export type Direction = "inbound" | "outbound";

export interface MessagingProfile {
  id: string;
  name: string;
  enabled: boolean;
  webhook_url: string | null;
  webhook_failover_url: string | null;
  webhook_api_version: string | null;
}

export interface PhoneNumber {
  id: string;
  phone_number: string;
  messaging_profile_id: string | null;
  health?: { inbound_outbound_ratio?: number; success_ratio?: number } | null;
}

/** A single message as persisted in MongoDB (`messages` collection). */
export interface MessageDoc {
  /** Telnyx message id — unique; used to upsert/dedupe webhook + send results. */
  telnyxId: string;
  direction: Direction;
  /** Our (Telnyx-owned) number involved in the message, E.164. */
  ourNumber: string;
  /** The external party, E.164. Threads are grouped by (ourNumber, contactNumber). */
  contactNumber: string;
  text: string;
  mediaUrls: string[];
  /** Latest known delivery status, e.g. queued | sending | sent | delivered | failed. */
  status: string;
  messagingProfileId: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  updatedAt: Date;
  /** Raw Telnyx payload for auditing/replay. */
  raw?: unknown;
}

/** A thread summary for the inbox list. */
export interface Conversation {
  ourNumber: string;
  contactNumber: string;
  lastText: string;
  lastDirection: Direction;
  lastAt: Date;
  messageCount: number;
}
