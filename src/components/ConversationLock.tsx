"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PasscodeDialog from "@/components/PasscodeDialog";
import { callEncrypt } from "@/lib/encrypt-client";

export default function ConversationLock({
  ourNumber,
  contactNumber,
}: {
  ourNumber: string;
  contactNumber: string;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"encrypt" | "decrypt" | null>(null);

  async function confirm(passcode: string) {
    if (!action) return false;
    const ok = await callEncrypt({
      action,
      target: "conversation",
      ourNumber,
      contactNumber,
      passcode,
    });
    if (ok) router.refresh();
    return ok;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Conversation actions">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAction("encrypt")}>
            <Lock className="size-4" />
            Encrypt conversation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("decrypt")}>
            <LockOpen className="size-4" />
            Decrypt conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasscodeDialog
        open={action !== null}
        onOpenChange={(o) => !o && setAction(null)}
        title={
          action === "decrypt" ? "Decrypt conversation" : "Encrypt conversation"
        }
        description={
          action === "decrypt"
            ? "Enter the passcode to restore every message in this thread."
            : "Enter the passcode to encrypt every message in this thread. Their text will be replaced with unreadable ciphertext until decrypted."
        }
        actionLabel={action === "decrypt" ? "Decrypt all" : "Encrypt all"}
        destructive={action === "encrypt"}
        onConfirm={confirm}
      />
    </>
  );
}
