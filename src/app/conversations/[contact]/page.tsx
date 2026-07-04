import Link from "next/link";
import { ArrowLeft, Lock, Paperclip } from "lucide-react";
import { getConversation } from "@/lib/store";
import SendForm from "@/components/SendForm";
import MessageLock from "@/components/MessageLock";
import ConversationLock from "@/components/ConversationLock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const msgs = ourNumber ? await getConversation(ourNumber, contactNumber) : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/conversations">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tabular-nums">{contactNumber}</h1>
          <p className="text-xs text-muted-foreground">
            via {ourNumber || "unknown"}
          </p>
        </div>
        {ourNumber && (
          <ConversationLock
            ourNumber={ourNumber}
            contactNumber={contactNumber}
          />
        )}
      </div>

      <Card>
        <CardContent className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto py-5">
          {msgs.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No messages in this thread.
            </p>
          )}
          {msgs.map((m) => {
            const outbound = m.direction === "outbound";
            return (
              <div
                key={m.telnyxId}
                className={cn(
                  "flex flex-col",
                  outbound ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    m.encrypted
                      ? "border border-dashed bg-muted/60 text-muted-foreground"
                      : outbound
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  {m.encrypted ? (
                    <div className="flex items-start gap-1.5">
                      <Lock className="mt-0.5 size-3 shrink-0" />
                      <span className="break-all font-mono text-xs">
                        {m.cipher?.data ?? "•••••••••"}
                      </span>
                    </div>
                  ) : (
                    <>
                      {m.text && (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      )}
                      {m.mediaUrls.map((u) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs underline opacity-90"
                        >
                          <Paperclip className="size-3" />
                          attachment
                        </a>
                      ))}
                    </>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                  <span>
                    {m.status} · {new Date(m.updatedAt).toLocaleString()}
                  </span>
                  <MessageLock
                    telnyxId={m.telnyxId}
                    encrypted={!!m.encrypted}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <SendForm defaultFrom={ourNumber} to={contactNumber} />
    </div>
  );
}
