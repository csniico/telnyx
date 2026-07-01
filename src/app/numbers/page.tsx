import { AlertCircle, Phone } from "lucide-react";
import { listMessagingNumbers } from "@/lib/telnyx";
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

export default async function NumbersPage() {
  let numbers;
  let error: string | null = null;
  try {
    numbers = await listMessagingNumbers();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Phone numbers</h1>
        <p className="text-sm text-muted-foreground">
          Messaging-enabled numbers on your account.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            Failed to load numbers: {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Numbers</CardTitle>
          <CardDescription>
            {numbers ? `${numbers.length} total` : "Live data from the Telnyx API."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {numbers && numbers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messaging-enabled numbers found.
            </p>
          )}
          {numbers && numbers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead className="text-right">Messaging profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="flex items-center gap-2 font-medium tabular-nums">
                      <Phone className="size-4 text-muted-foreground" />
                      {n.phone_number}
                    </TableCell>
                    <TableCell className="text-right">
                      {n.messaging_profile_id ? (
                        <span className="text-muted-foreground">
                          {n.messaging_profile_id}
                        </span>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
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
