"use client";

import { useState } from "react";

export default function Verify() {
  const [docid, setDocid] = useState("");
  const [sha256, setSha256] = useState("");
  const [out, setOut] = useState(null);

  async function verify() {
    setOut({ loading: true });
    const r = await fetch("/api/health");
    const j = await r.json();
    setOut({ ok: true, api: j, note: "API is reachable. Next: wire /api/verify to your DB." });
  }

  return (
    <main className="min-h-screen bg-[#0B0E14] text-[#E6E6E6]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a className="text-sm text-[#F2D27A]" href="/">← Home</a>
        <h1 className="mt-4 text-3xl font-semibold">Verify</h1>
        <p className="mt-2 text-sm text-[#A7B0C0]">Paste a DOC ID or SHA-256.</p>

        <div className="mt-6 rounded-2xl border border-[#1e2432] bg-[#121826]/70 p-5">
          <label className="text-xs text-[#A7B0C0]">DOC ID</label>
          <input
            className="mt-2 w-full rounded-xl border border-[#1e2432] bg-black/20 px-3 py-2 text-sm"
            value={docid}
            onChange={(e) => setDocid(e.target.value)}
            placeholder="DOC-00000001"
          />

          <label className="mt-4 block text-xs text-[#A7B0C0]">SHA-256</label>
          <input
            className="mt-2 w-full rounded-xl border border-[#1e2432] bg-black/20 px-3 py-2 text-sm font-mono"
            value={sha256}
            onChange={(e) => setSha256(e.target.value)}
            placeholder="64-hex hash"
          />

          <button
            onClick={verify}
            className="mt-4 rounded-xl border border-[#3b4a6b] bg-[#1a2440] px-4 py-2 text-sm"
          >
            Verify
          </button>

          {out && (
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1e2432] bg-black/20 p-3 text-xs">
              {JSON.stringify(out, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
