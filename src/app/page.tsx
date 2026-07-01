import { AlertCircle, CheckCircle2, Phone, Webhook } from "lucide-react";
import { listMessagingProfiles, listMessagingNumbers } from "@/lib/telnyx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [profilesRes, numbersRes] = await Promise.allSettled([
    listMessagingProfiles(),
    listMessagingNumbers(),
  ]);

  const profiles =
    profilesRes.status === "fulfilled" ? profilesRes.value : null;
  const numbers = numbersRes.status === "fulfilled" ? numbersRes.value : null;
  const error =
    profilesRes.status === "rejected"
      ? String(profilesRes.reason?.message ?? profilesRes.reason)
      : null;

  const enabledCount = profiles?.filter((p) => p.enabled).length ?? 0;
  const withWebhook = profiles?.filter((p) => p.webhook_url).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Telnyx messaging profiles and numbers.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            Failed to load from Telnyx: {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Enabled profiles"
          value={`${enabledCount}${profiles ? ` / ${profiles.length}` : ""}`}
        />
        <StatCard
          icon={<Webhook className="size-5" />}
          label="Webhooks configured"
          value={`${withWebhook}${profiles ? ` / ${profiles.length}` : ""}`}
        />
        <StatCard
          icon={<Phone className="size-5" />}
          label="Messaging numbers"
          value={numbers ? String(numbers.length) : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messaging profiles</CardTitle>
          <CardDescription>Live data from the Telnyx API.</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles && profiles.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messaging profiles found on this account.
            </p>
          )}
          {profiles && profiles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Webhook URL</TableHead>
                  <TableHead className="text-right">API version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.enabled ? "default" : "secondary"}>
                        {p.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {p.webhook_url || "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {p.webhook_api_version || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
