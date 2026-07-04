import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Lock, MessagesSquare } from "lucide-react";
import { listConversations } from "@/lib/store";
import ConversationLock from "@/components/ConversationLock";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function initials(num: string | null | undefined): string {
  const digits = (num ?? "").replace(/\D/g, "");
  return digits.slice(-2) || "??";
}

export default async function ConversationsPage() {
  const conversations = await listConversations();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
        <p className="text-sm text-muted-foreground">
          Threads built from inbound &amp; outbound webhooks stored in a
          database.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessagesSquare className="size-6" />
            </div>
            <div className="text-sm font-medium">No messages yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Send a message, or receive an inbound SMS once your webhook URL is
              configured on the messaging profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {conversations.map((c) => {
            const contact = c.contactNumber || "unknown";
            const our = c.ourNumber || "unknown";
            const href = `/conversations/${encodeURIComponent(
              contact,
            )}?our=${encodeURIComponent(our)}`;
            const Inbound = c.lastDirection === "inbound";
            return (
              <Card
                key={`${our}:${contact}`}
                className="transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar className="size-10">
                      <AvatarFallback className="text-xs">
                        {initials(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium tabular-nums">
                          {contact}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          via {our}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {c.lastEncrypted ? (
                          <>
                            <Lock className="size-3.5 shrink-0" />
                            <span className="truncate font-mono text-xs">
                              {c.lastCipherData ?? "•••••••••"}
                            </span>
                          </>
                        ) : (
                          <>
                            {Inbound ? (
                              <ArrowDownLeft className="size-3.5 shrink-0 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="size-3.5 shrink-0 text-sky-600" />
                            )}
                            <span className="truncate">{c.lastText || "—"}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="secondary">{c.messageCount}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.lastAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ConversationLock ourNumber={our} contactNumber={contact} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
