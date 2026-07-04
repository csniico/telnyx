import "server-only";
import crypto from "node:crypto";
import { env } from "./env";
import type { CipherBlob } from "./types";

/**
 * Message-level encryption. Encrypting a message is our "delete": the plaintext
 * is replaced by AES-256-GCM ciphertext and only the MESSAGE_PASSCODE can bring
 * it back. The key is derived from the passcode via scrypt with a fixed salt so
 * the same passcode always yields the same key.
 */

const SALT = "telnyx-admin::message-encryption::v1";

function deriveKey(passcode: string): Buffer {
  return crypto.scryptSync(passcode, SALT, 32);
}

/** Constant-time check that the supplied passcode matches MESSAGE_PASSCODE. */
export function isValidPasscode(passcode: string): boolean {
  const a = Buffer.from(passcode);
  const b = Buffer.from(env.messagePasscode);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function encryptText(plaintext: string, passcode: string): CipherBlob {
  const key = deriveKey(passcode);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: data.toString("base64"),
  };
}

/** Throws if the passcode is wrong (GCM auth tag fails to verify). */
export function decryptText(blob: CipherBlob, passcode: string): string {
  const key = deriveKey(passcode);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const out = Buffer.concat([
    decipher.update(Buffer.from(blob.data, "base64")),
    decipher.final(),
  ]);
  return out.toString("utf8");
}
