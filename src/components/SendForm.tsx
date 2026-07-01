"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function SendForm({
  defaultFrom,
  to,
}: {
  defaultFrom: string;
  to: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [from, setFrom] = useState(defaultFrom);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "send failed");
      setText("");
      toast.success("Message sent");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text && from) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From number (+1…)"
          className="max-w-[220px] tabular-nums"
        />
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message ${to}…  (⌘/Ctrl + Enter to send)`}
            rows={2}
            className="resize-none"
          />
          <Button onClick={send} disabled={busy || !text || !from} size="lg">
            <Send className="size-4" />
            {busy ? "Sending…" : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
