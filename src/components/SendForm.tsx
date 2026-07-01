"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "send failed");
      setText("");
      router.refresh(); // re-run the server component to show the new message
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row">
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From (+1...)"
          style={{ width: 160 }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message to ${to}`}
          rows={2}
        />
        <button onClick={send} disabled={busy || !text || !from}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
