"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import PasscodeDialog from "@/components/PasscodeDialog";
import { callEncrypt } from "@/lib/encrypt-client";

export default function MessageLock({
  telnyxId,
  encrypted,
}: {
  telnyxId: string;
  encrypted: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const action = encrypted ? "decrypt" : "encrypt";

  async function confirm(passcode: string) {
    const ok = await callEncrypt({
      action,
      target: "message",
      telnyxId,
      passcode,
    });
    if (ok) router.refresh();
    return ok;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-60 hover:opacity-100"
        aria-label={encrypted ? "Decrypt message" : "Encrypt message"}
        onClick={() => setOpen(true)}
      >
        {encrypted ? (
          <LockOpen className="size-3.5" />
        ) : (
          <Lock className="size-3.5" />
        )}
      </Button>
      <PasscodeDialog
        open={open}
        onOpenChange={setOpen}
        title={encrypted ? "Decrypt message" : "Encrypt message"}
        description={
          encrypted
            ? "Enter the passcode to restore this message's text."
            : "Enter the passcode to encrypt this message. Its text will be replaced with unreadable ciphertext until decrypted."
        }
        actionLabel={encrypted ? "Decrypt" : "Encrypt"}
        destructive={!encrypted}
        onConfirm={confirm}
      />
    </>
  );
}
