// Client helper to call the encrypt/decrypt API. No secrets here — the passcode
// is entered by the user at request time and only sent to the server.

import { toast } from "sonner";

export interface EncryptRequest {
  action: "encrypt" | "decrypt";
  target: "message" | "conversation";
  passcode: string;
  telnyxId?: string;
  ourNumber?: string;
  contactNumber?: string;
}

/** Returns true on success. Shows a toast either way. */
export async function callEncrypt(req: EncryptRequest): Promise<boolean> {
  try {
    const res = await fetch("/api/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "operation failed");
    const verb = req.action === "encrypt" ? "Encrypted" : "Decrypted";
    toast.success(
      typeof json.count === "number"
        ? `${verb} ${json.count} message${json.count === 1 ? "" : "s"}`
        : `${verb}`,
    );
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : String(err));
    return false;
  }
}
