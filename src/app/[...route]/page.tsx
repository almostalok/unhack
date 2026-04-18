import Link from "next/link";

type Screen = {
  title: string;
  subtitle: string;
  panels: string[];
  actions: string[];
};

const screenMap: Record<string, Screen> = {
  "dashboard": {
    title: "Organizer Dashboard",
    subtitle: "Events overview with key KPIs and global notifications.",
    panels: ["Event cards", "Participant + submissions stats", "Upcoming deadlines", "Notifications feed"],
    actions: ["Create event", "Open command center"],
  },
  "events/new": {
    title: "Event Studio",
    subtitle: "Wizard for basics, registration, tracks, branding, and publish settings.",
    panels: ["Step navigation", "Form builder", "Track/prize editor", "Landing page preview"],
    actions: ["Save draft", "Publish event"],
  },
  "events/manage": {
    title: "Event Command Center",
    subtitle: "Central management surface for all organizer operations.",
    panels: ["Sidebar modules", "Live stats", "Approvals", "Bulk actions"],
    actions: ["Manage rounds", "Open analytics"],
  },
  "events/rounds": {
    title: "Rounds Manager",
    subtitle: "Define rounds, rubrics, assignments, and lifecycle actions.",
    panels: ["Round timeline", "Rubric builder", "Judge assignment matrix", "Round actions"],
    actions: ["Run calibration", "Run bias compensation"],
  },
  "events/scoring-dashboard": {
    title: "Live Judging Monitor",
    subtitle: "Heatmap, progress indicators, and compensation impact views.",
    panels: ["Judge x Team heatmap", "Coverage indicators", "Bias report cards", "Raw vs compensated leaderboard"],
    actions: ["Send reminders", "Trigger compensation"],
  },
  "events/analytics": {
    title: "Event Analytics",
    subtitle: "Funnel, submissions, score distributions, map, and exports.",
    panels: ["Registration funnel", "Judge histograms", "Track breakdown", "Mentor utilization"],
    actions: ["Export CSV", "Generate PDF wrap report"],
  },
  "e": {
    title: "Public Event Landing",
    subtitle: "Hero, tracks, prizes, judges/mentors, sponsors, FAQ, and CTA.",
    panels: ["Hero banner", "Prize + sponsor tiers", "Schedule timeline", "Countdown timer"],
    actions: ["Register now", "Browse projects"],
  },
  "e/register": {
    title: "Participant Registration",
    subtitle: "Open/app-based/waitlist registration with custom questions.",
    panels: ["Identity form", "Skills selector", "In-person fields", "Custom question sections"],
    actions: ["Submit registration", "Join waitlist"],
  },
  "e/team": {
    title: "Team Workspace",
    subtitle: "Create team, join by invite, or manage current team.",
    panels: ["Create/join switch", "Member list", "Invite tools", "Team lock controls"],
    actions: ["Create team", "Join team"],
  },
  "e/find-teammates": {
    title: "Find Teammates",
    subtitle: "Skill-based participant board and team matching workflow.",
    panels: ["Participant cards", "Track filters", "Team invite actions", "Looking-for-team board"],
    actions: ["Express interest", "Accept/reject requests"],
  },
  "e/submit": {
    title: "Round Submission",
    subtitle: "All artifacts, autosave drafts, deadlines, and late penalty guardrails.",
    panels: ["Round brief", "Artifact form", "Custom prompts", "Upload manager"],
    actions: ["Save draft", "Submit final"],
  },
  "e/scores": {
    title: "Score Transparency Card",
    subtitle: "Compensated score, rubric detail, judge breakdown, comments, and appeals.",
    panels: ["Round summary", "Rubric bars", "Per-judge impact", "Appeals module"],
    actions: ["Open appeal", "Download report"],
  },
  "e/leaderboard": {
    title: "Public Leaderboard",
    subtitle: "Live rank view with round toggle and team highlighting.",
    panels: ["Ranking table", "Round filter", "Search", "Top-3 celebration"],
    actions: ["Switch round", "Share"],
  },
  "e/project-gallery": {
    title: "Project Gallery",
    subtitle: "Filterable team showcase with likes and crowd voting.",
    panels: ["Card grid", "Track/tag filters", "Crowd-choice voting", "Project detail links"],
    actions: ["Like project", "Cast vote"],
  },
  "e/mentors": {
    title: "Mentor Booking",
    subtitle: "Browse mentors, view slots, and confirm office hours bookings.",
    panels: ["Mentor directory", "Calendar slots", "Booking confirmation", "My bookings"],
    actions: ["Book slot", "Join call"],
  },
  "e/hub": {
    title: "Live Event Hub",
    subtitle: "Announcements, schedule, resources, chat channels, and sponsor spotlight.",
    panels: ["Pinned feed", "Live schedule", "Resource center", "In-app chat"],
    actions: ["Post message", "Open resources"],
  },
  "judge": {
    title: "Judge Portal",
    subtitle: "Assigned rounds, scoring progress, and deadlines dashboard.",
    panels: ["Welcome panel", "Round assignments", "Progress meter", "Deadline cards"],
    actions: ["Start calibration", "Continue scoring"],
  },
  "judge/calibrate": {
    title: "Calibration Round",
    subtitle: "Standardize rubric interpretation before live scoring.",
    panels: ["Sample submission", "Rubric inputs", "Private scoring", "Deviation flags"],
    actions: ["Submit calibration"],
  },
  "judge/score": {
    title: "Scoring Interface",
    subtitle: "Artifact viewer plus rubric scoring and comments with keyboard shortcuts.",
    panels: ["Assigned teams sidebar", "Submission artifact viewer", "Scoring panel", "Autosave state"],
    actions: ["Submit scores", "Next team"],
  },
  "judge/summary": {
    title: "Judge Summary",
    subtitle: "Post-judging review and anonymized calibration feedback.",
    panels: ["Read-only scoring grid", "Relative distribution", "Bias index explainer", "Improvement tips"],
    actions: ["Download summary"],
  },
  "sponsor": {
    title: "Sponsor Portal",
    subtitle: "Visibility stats, logo preview, track analytics, and prize outcomes.",
    panels: ["Brand placement", "Participant reach", "Sponsored track stats", "Winner announcement"],
    actions: ["Export report"],
  },
  "docs/api": {
    title: "Public API Docs",
    subtitle: "API key auth, webhook events, and endpoint references.",
    panels: ["Authentication", "Endpoints", "Webhook payloads", "SDK examples"],
    actions: ["Create API key", "Test webhook"],
  },
};

function resolveScreen(path: string[]) {
  if (!path.length) return null;
  if (path[0] === "events" && path[2] === "manage") return screenMap["events/manage"];
  if (path[0] === "events" && path[2] === "rounds") return screenMap["events/rounds"];
  if (path[0] === "events" && path[2] === "scoring-dashboard") return screenMap["events/scoring-dashboard"];
  if (path[0] === "events" && path[2] === "analytics") return screenMap["events/analytics"];
  if (path[0] === "events" && path[1] === "new") return screenMap["events/new"];
  if (path[0] === "e" && path.length === 2) return screenMap["e"];
  if (path[0] === "e" && path[2] === "register") return screenMap["e/register"];
  if (path[0] === "e" && path[2] === "team") return screenMap["e/team"];
  if (path[0] === "e" && path[2] === "find-teammates") return screenMap["e/find-teammates"];
  if (path[0] === "e" && path[2] === "submit") return screenMap["e/submit"];
  if (path[0] === "e" && path[2] === "scores") return screenMap["e/scores"];
  if (path[0] === "e" && path[2] === "leaderboard") return screenMap["e/leaderboard"];
  if (path[0] === "e" && path[2] === "project-gallery") return screenMap["e/project-gallery"];
  if (path[0] === "e" && path[2] === "mentors") return screenMap["e/mentors"];
  if (path[0] === "e" && path[2] === "hub") return screenMap["e/hub"];
  if (path[0] === "judge" && path.length === 2) return screenMap["judge"];
  if (path[0] === "judge" && path[2] === "calibrate") return screenMap["judge/calibrate"];
  if (path[0] === "judge" && path[2] === "score") return screenMap["judge/score"];
  if (path[0] === "judge" && path[2] === "summary") return screenMap["judge/summary"];
  if (path[0] === "sponsor") return screenMap["sponsor"];
  if (path[0] === "docs" && path[1] === "api") return screenMap["docs/api"];
  if (path[0] === "dashboard") return screenMap["dashboard"];
  return null;
}

export default async function RoutePage({ params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const screen = resolveScreen(route);

  if (!screen) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-semibold">UnHack</h1>
        <p className="mt-2 text-slate-600">This route is not configured yet.</p>
        <Link href="/dashboard" className="mt-5 rounded-md bg-[#534AB7] px-4 py-2 text-white">
          Open dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl bg-gradient-to-r from-[#534AB7] to-[#1D9E75] p-6 text-white">
        <h1 className="text-3xl font-semibold">{screen.title}</h1>
        <p className="mt-2 text-sm text-white/90">{screen.subtitle}</p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {screen.panels.map((panel) => (
          <article key={panel} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">{panel}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Fully responsive container with loading and empty-state support.
            </p>
            <div className="mt-4 h-20 rounded-md bg-slate-100 dark:bg-slate-800" aria-hidden />
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Primary actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {screen.actions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-md bg-[#534AB7] px-4 py-2 text-sm font-medium text-white hover:bg-[#4238a8]"
            >
              {action}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
