import { listMessagingProfiles } from "@/lib/telnyx";

// SSR on every request — always show live profile data.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let profiles;
  let error: string | null = null;
  try {
    profiles = await listMessagingProfiles();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <h1>Messaging Profiles</h1>
      {error && <p className="error">Failed to load profiles: {error}</p>}
      {profiles && profiles.length === 0 && (
        <p className="muted">No messaging profiles found on this account.</p>
      )}
      {profiles && profiles.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Enabled</th>
              <th>Webhook URL</th>
              <th>API version</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.enabled ? "yes" : "no"}</td>
                <td className="muted">{p.webhook_url || "—"}</td>
                <td>{p.webhook_api_version || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
