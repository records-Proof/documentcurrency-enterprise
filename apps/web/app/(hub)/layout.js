import "../globals.css";
import Link from "next/link";

export default function HubLayout({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex gap-4">
        <aside className="w-56 shrink-0 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4">
          <div className="font-semibold">Enterprise Hub</div>
          <nav className="mt-3 space-y-1 text-sm">
            <Link className="block rounded-lg px-3 py-2 hover:bg-black/20" href="/hub">Dashboard</Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-black/20" href="/hub/keys">API Keys</Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-black/20" href="/hub/audit">Audit Logs</Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-black/20" href="/hub/verifications">Verifications</Link>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
