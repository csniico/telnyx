import Link from "next/link";
import { getConversation } from "@/lib/store";
import SendForm from "@/components/SendForm";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ contact: string }>;
  searchParams: Promise<{ our?: string }>;
}) {
  const { contact } = await params;
  const { our } = await searchParams;
  const contactNumber = decodeURIComponent(contact);
  const ourNumber = our ? decodeURIComponent(our) : "";

  const msgs = ourNumber
    ? await getConversation(ourNumber, contactNumber)
    : [];

  return (
    <>
      <p>
        <Link href="/conversations">← All conversations</Link>
      </p>
      <h1>{contactNumber}</h1>
      <p className="muted">via {ourNumber || "unknown"}</p>

      <div className="card thread">
        {msgs.length === 0 && <p className="muted">No messages in this thread.</p>}
        {msgs.map((m) => (
          <div key={m.telnyxId} className={`bubble ${m.direction}`}>
            <div>{m.text}</div>
            {m.mediaUrls.map((u) => (
              <div key={u} className="muted">
                📎 {u}
              </div>
            ))}
            <div className="muted" style={{ fontSize: "0.7rem" }}>
              {m.status} · {new Date(m.updatedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <SendForm defaultFrom={ourNumber} to={contactNumber} />
    </>
  );
}
