import Link from "next/link";
import { listConversations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await listConversations();

  return (
    <>
      <h1>Conversations</h1>
      <p className="muted">
        Threads are built from inbound + outbound webhooks stored in MongoDB.
      </p>
      {conversations.length === 0 && (
        <p className="muted">
          No messages yet. Send one, or receive an inbound SMS once your webhook
          URL is configured on the messaging profile.
        </p>
      )}
      <div>
        {conversations.map((c) => {
          const href = `/conversations/${encodeURIComponent(
            c.contactNumber,
          )}?our=${encodeURIComponent(c.ourNumber)}`;
          return (
            <Link key={`${c.ourNumber}:${c.contactNumber}`} href={href}>
              <div className="card">
                <div>
                  <strong>{c.contactNumber}</strong>{" "}
                  <span className="muted">via {c.ourNumber}</span>
                </div>
                <div className="muted">
                  {c.lastDirection === "inbound" ? "← " : "→ "}
                  {c.lastText.slice(0, 80)}
                </div>
                <div className="badge">{c.messageCount} messages</div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
