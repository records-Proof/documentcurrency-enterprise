export default function Hub() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          Enterprise controls: keys, audits, and verification history.
        </p>
      </div>
    </div>
  );
}
