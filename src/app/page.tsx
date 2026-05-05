"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Star,
  ShieldCheck,
  Zap,
  Award,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Organizer Command Center",
    description: "Live KPIs, bulk approval queues, and real-time event monitoring — everything you need to run a smooth hackathon.",
    href: "/dashboard",
    color: "text-[#534AB7]",
    bg: "bg-[#534AB7]/10",
  },
  {
    icon: Users,
    title: "Participant Lifecycle",
    description: "From open registration to team formation, submissions, and score transparency cards — participants stay informed every step.",
    href: "/e/team",
    color: "text-[#1D9E75]",
    bg: "bg-[#1D9E75]/10",
  },
  {
    icon: Star,
    title: "Judge Scoring & Calibration",
    description: "Artifact viewer with rubric inputs, keyboard shortcuts, autosave, and a calibration round to align judges before scoring begins.",
    href: "/judge",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Bias Compensation",
    description: "Z-score normalization corrects for judge leniency and severity, giving every team a fair compensated score backed by transparent math.",
    href: "/events/scoring-dashboard",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Zap,
    title: "Realtime Collaboration",
    description: "Socket.IO + Redis pub/sub powers live announcements, leaderboard updates, scoring progress, and in-app chat channels.",
    href: "/e/hub",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: Award,
    title: "Certificates & Analytics",
    description: "Auto-generated PDF certificates with QR verification, plus registration funnels, score distributions, and exportable wrap reports.",
    href: "/events/analytics",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

const roles = [
  { label: "Organizer", href: "/dashboard", description: "Manage events end-to-end" },
  { label: "Participant", href: "/e/team", description: "Register, build, and submit" },
  { label: "Judge", href: "/judge", description: "Score and calibrate" },
  { label: "Sponsor", href: "/sponsor", description: "Track brand impact" },
];

const stats = [
  { value: "6", label: "Judging rounds" },
  { value: "23", label: "Screen modules" },
  { value: "∞", label: "Hackathons" },
  { value: "100%", label: "Fair scoring" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 p-6 pb-20 sm:p-10">
      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#534AB7] via-[#5f53cf] to-[#1D9E75] p-8 text-white shadow-xl"
      >
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-80 w-80 rounded-full bg-white/5" aria-hidden="true" />

        <div className="flex items-center gap-3 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white">U✓</div>
          UnHack
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Fair by design. Transparent by default.
        </h1>
        <p className="mt-3 max-w-2xl text-white/85 sm:text-lg">
          A full-stack hackathon operating system — from registration and team formation through bias-compensated judging, realtime collaboration, and verifiable certificates.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#534AB7] shadow transition hover:bg-white/90"
          >
            Open Dashboard <ArrowRight size={15} />
          </Link>
          <Link
            href="/docs/api"
            className="flex items-center gap-2 rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            API Docs
          </Link>
        </div>
      </motion.header>

      {/* Stats strip */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-3xl font-bold text-[#534AB7]">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Feature cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Platform modules</h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-700 dark:bg-slate-900"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}>
                  <Icon size={20} className={f.color} />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-slate-300">{f.description}</p>
                <Link
                  href={f.href}
                  className={`mt-4 flex items-center gap-1 text-sm font-medium ${f.color} opacity-0 transition group-hover:opacity-100`}
                >
                  Explore <ChevronRight size={14} />
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Role navigation */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Jump in by role</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm transition hover:border-[#534AB7] hover:bg-[#534AB7]/5 dark:border-slate-700 dark:hover:border-[#534AB7]"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{r.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>
          ))}
        </div>
      </motion.section>
    </main>
  );
}

