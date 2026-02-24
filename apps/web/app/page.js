export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0E14] text-[#E6E6E6]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between border-b border-[#1e2432] pb-4">
          <div className="flex items-center gap-3">
            <div className="font-bold tracking-wide">DOC.USD</div>
            <span className="rounded-full border border-[#1e2432] px-3 py-1 text-xs text-[#A7B0C0]">
              docusd.com
            </span>
          </div>
          <nav className="flex gap-4 text-sm text-[#A7B0C0]">
            <a className="hover:text-[#E6E6E6]" href="/verify">Verify</a>
            <a className="hover:text-[#E6E6E6]" href="/registry">Registry</a>
            <a className="hover:text-[#E6E6E6]" href="/issue">Issue</a>
          </nav>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-semibold leading-tight">
            Verifiable Document Currency
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#A7B0C0]">
            DOC.USD turns invoices, receipts, contracts, and records into cryptographically verifiable
            instruments — canonicalized, hashed, and independently auditable.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/verify" className="rounded-xl border border-[#3b4a6b] bg-[#1a2440] px-4 py-2 text-sm">
              Verify a Document
            </a>
            <a href="/registry" className="rounded-xl border border-[#1e2432] bg-[#121826] px-4 py-2 text-sm">
              View Registry
            </a>
            <a href="/issue" className="rounded-xl border border-[#2f4b2d] bg-[#122014] px-4 py-2 text-sm">
              Issue DOC.USD
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Verify", body: "Validate a DOC ID or SHA-256 against the recorded canonical form." },
            { title: "Registry", body: "Browse issued records, timestamps, and proof metadata." },
            { title: "Issue", body: "Create a new record, compute the hash, and generate a receipt." },
          ].map((x) => (
            <div key={x.title} className="rounded-2xl border border-[#1e2432] bg-[#121826]/70 p-5">
              <div className="font-semibold">{x.title}</div>
              <div className="mt-2 text-sm text-[#A7B0C0]">{x.body}</div>
            </div>
          ))}
        </section>

        <footer className="mt-12 border-t border-[#1e2432] pt-6 text-xs text-[#A7B0C0]">
          Author of Record: Kam Swygert • TransitCloud Document Currency Infrastructure
        </footer>
      </div>
    </main>
  );
}
