export default function Keys() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6">
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Create and manage API keys for resolver access.
        </p>

        <div className="mt-4 rounded-xl border border-[color:var(--line)] bg-black/20 p-4 text-sm text-[color:var(--muted)]">
          Developer Edition note: next step is wiring a Create/Rotate/Revoke workflow and listing keys from Postgres.
        </div>
      </div>
    </div>
  );
}
