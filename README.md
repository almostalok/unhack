# UnHack

> **Fair by design. Transparent by default.**

UnHack is a full-stack hackathon operating system built for organizers, participants, judges, and sponsors. It handles the entire event lifecycle — from registration and team formation through multi-round judging with bias compensation, all the way to certificate generation and post-event analytics.

---

## ✨ Features

### For Organizers
- **Event Studio** — wizard-based event creation with branding, registration settings, tracks, and prizes
- **Command Center** — live KPIs, bulk actions, approval queues, and real-time notifications
- **Rounds Manager** — configurable rounds with custom rubrics, judge assignment matrices, and lifecycle controls
- **Live Judging Monitor** — judge × team heatmap, coverage indicators, and bias report cards
- **Analytics Dashboard** — registration funnel, score distributions, mentor utilization, and CSV/PDF exports
- **Webhook & API** — API-key authentication, webhook delivery logs, and a built-in API docs portal

### For Participants
- **Registration** — open, application-based, or invite-only flows with custom questions and waitlist support
- **Team Workspace** — create or join teams by invite code, manage members, and lock before submission
- **Find Teammates** — skill-based discovery board with team matching and interest requests
- **Round Submissions** — multi-artifact submissions (GitHub, demo, Figma, video, deck, file upload) with autosave and late-penalty guardrails
- **Score Transparency Cards** — per-rubric breakdown, judge impact view, compensated scores, and appeals
- **Public Leaderboard & Project Gallery** — live rankings, crowd voting, and team showcase
- **Mentor Booking** — browse mentors, view calendar slots, and confirm office-hours bookings
- **Live Event Hub** — pinned announcements, schedule, resource center, and in-app chat channels

### For Judges
- **Calibration Round** — standardize rubric interpretation before live scoring
- **Scoring Interface** — artifact viewer with rubric inputs, per-criterion comments, keyboard shortcuts, and autosave
- **Judge Summary** — post-judging review with relative distribution and bias-index explanation

### For Sponsors
- **Sponsor Portal** — brand placement preview, participant reach stats, sponsored-track analytics, and exportable reports

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via [Prisma ORM](https://www.prisma.io) |
| Auth | [NextAuth.js](https://next-auth.js.org) — credentials + Google OAuth |
| Realtime | Socket.IO + Redis pub/sub (ioredis) |
| Email | [Resend](https://resend.com) |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Tables | TanStack Table |
| Animations | Framer Motion |
| Certificate generation | Puppeteer |
| QR codes | qrcode |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database
- Redis instance (optional — required for realtime features)

### 1. Clone and install dependencies

```bash
git clone https://github.com/almostalok/unhack.git
cd unhack
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/unhack"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis (optional — enables realtime events)
REDIS_URL="redis://localhost:6379"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
```

### 3. Set up the database

```bash
# Apply migrations and generate the Prisma client
npm run db:migrate
npm run db:generate
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🗄 Database Management

| Command | Description |
|---|---|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push schema changes to the database without a migration file |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## 📁 Project Structure

```
unhack/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── [...route]/      # Scaffold pages for all app routes
│   │   ├── verify/          # Certificate verification
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing page
│   └── lib/
│       ├── auth.ts          # NextAuth configuration
│       ├── prisma.ts        # Prisma client singleton
│       ├── realtime.ts      # Redis pub/sub helpers
│       ├── email.ts         # Email sending utilities
│       ├── certificate.ts   # PDF certificate generation
│       ├── compensation.ts  # Bias compensation scoring logic
│       └── notification-events.ts
├── public/
├── next.config.ts
└── package.json
```

---

## 🔐 Authentication

UnHack supports two authentication strategies:

- **Email + Password** — bcrypt-hashed credentials stored in PostgreSQL
- **Google OAuth** — via NextAuth's Google provider

Sessions are JWT-based and managed through NextAuth with the Prisma adapter.

---

## ⚖️ Scoring & Bias Compensation

A core feature of UnHack is its **fair scoring engine**:

- Judges are assigned to specific teams per round via the judge assignment matrix
- Scores are captured per rubric criterion, per judge, per team
- A **calibration round** aligns judge interpretation before live scoring
- The compensation engine calculates **normalized scores**, **z-scores**, and **weighted totals** to correct for judge leniency/severity bias
- Every team receives a **Score Transparency Card** showing raw vs. compensated scores and per-judge impact breakdowns
- Teams can file **score appeals** that organizers review and resolve

---

## 🔁 Realtime Events

When `REDIS_URL` is configured, the following events are broadcast over Redis pub/sub to connected Socket.IO clients:

| Event | Trigger |
|---|---|
| `scoring_progress_updated` | A judge submits scores |
| `leaderboard_updated` | Round results are recalculated |
| `announcement_posted` | Organizer posts an announcement |
| `submission_received` | A team submits their project |
| `round_status_changed` | A round transitions between statuses |
| `results_released` | Round results are made public |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a pull request

Please follow the existing TypeScript and ESLint conventions. Run `npm run lint` before submitting.

---

## 📄 License

This project is private. All rights reserved.
