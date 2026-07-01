import { listMessagingNumbers } from "@/lib/telnyx";

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
    <>
      <h1>Phone Numbers</h1>
      {error && <p className="error">Failed to load numbers: {error}</p>}
      {numbers && numbers.length === 0 && (
        <p className="muted">No messaging-enabled numbers found.</p>
      )}
      {numbers && numbers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Messaging profile</th>
            </tr>
          </thead>
          <tbody>
            {numbers.map((n) => (
              <tr key={n.id}>
                <td>{n.phone_number}</td>
                <td className="muted">{n.messaging_profile_id || "unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
