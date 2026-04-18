import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-6 sm:p-10">
      <header className="rounded-2xl bg-gradient-to-r from-[#534AB7] via-[#5f53cf] to-[#1D9E75] p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">U✓</div>
          UnHack
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Fair by design. Transparent by default.</h1>
        <p className="mt-3 max-w-3xl text-white/90">
          Complete hackathon operating system for organizers, participants, judges, and sponsors with scoring compensation, transparency cards, realtime collaboration, and certificate verification.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#534AB7]">
            Open Dashboard
          </Link>
          <Link href="/docs/api" className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white">
            API Docs
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Organizer command center",
          "Participant lifecycle",
          "Judge scoring and calibration",
          "Bias compensation + transparency",
          "Realtime notifications and chat",
          "Certificates and analytics",
        ].map((item) => (
          <article key={item} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-medium">{item}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Implemented with route-driven modules and Prisma-backed API services.</p>
          </article>
        ))}
      </section>
    </main>
  );
}

