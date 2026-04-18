import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { RegistrationStatus, RoundStatus, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCompensationReport, runCompensation } from "@/lib/compensation";
import { emitNotification } from "@/lib/notification-events";
import { generateCertificatePdf } from "@/lib/certificate";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function readBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function pathMatcher(path: string[]) {
  return path.join("/");
}

async function handleAuth(method: string, path: string[], request: NextRequest) {
  if (method === "POST" && pathMatcher(path) === "auth/register") {
    const body = await readBody(request);
    const passwordHash = await hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        skills: body.skills || [],
      },
    });
    return json({ user });
  }

  if (method === "POST" && pathMatcher(path) === "auth/login") {
    const body = await readBody(request);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) return json({ error: "Invalid credentials" }, 401);
    const ok = await compare(body.password, user.passwordHash);
    if (!ok) return json({ error: "Invalid credentials" }, 401);
    return json({ user });
  }

  if (method === "POST" && pathMatcher(path) === "auth/logout") {
    return json({ ok: true });
  }

  if (method === "GET" && pathMatcher(path) === "auth/me") {
    const email = request.headers.get("x-user-email");
    if (!email) return json({ user: null });
    const user = await prisma.user.findUnique({ where: { email } });
    return json({ user });
  }

  return null;
}

async function handleEvents(method: string, path: string[], request: NextRequest) {
  if (method === "POST" && pathMatcher(path) === "events") {
    const body = await readBody(request);
    const event = await prisma.event.create({
      data: {
        slug: body.slug,
        name: body.name,
        description: body.description || "",
        tagline: body.tagline,
        mode: body.mode || "ONLINE",
        timezone: body.timezone || "UTC",
        registrationOpen: new Date(body.registrationOpen),
        registrationClose: new Date(body.registrationClose),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    });
    return json(event, 201);
  }

  if (path[0] === "events" && path.length >= 2) {
    const slug = path[1];

    if (method === "GET" && path.length === 2) {
      const event = await prisma.event.findUnique({
        where: { slug },
        include: {
          tracks: true,
          prizes: true,
          sponsors: true,
          rounds: true,
          announcements: true,
          resources: true,
        },
      });
      return event ? json(event) : json({ error: "Event not found" }, 404);
    }

    if (method === "PATCH" && path.length === 2) {
      const body = await readBody(request);
      const event = await prisma.event.update({ where: { slug }, data: body });
      return json(event);
    }

    if (method === "DELETE" && path.length === 2) {
      await prisma.event.delete({ where: { slug } });
      return json({ ok: true });
    }

    if (method === "GET" && path.length === 3 && path[2] === "stats") {
      const event = await prisma.event.findUnique({ where: { slug } });
      if (!event) return json({ error: "Event not found" }, 404);

      const [participants, submissions, upcoming] = await Promise.all([
        prisma.registration.count({ where: { eventId: event.id, status: RegistrationStatus.CONFIRMED } }),
        prisma.submission.count({ where: { eventId: event.id, status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE_SUBMITTED] } } }),
        prisma.round.findMany({ where: { eventId: event.id, submissionClose: { gte: new Date() } }, take: 3, orderBy: { submissionClose: "asc" } }),
      ]);

      return json({ participants, submissions, upcomingDeadlines: upcoming });
    }

    if (method === "GET" && path.length === 3 && path[2] === "leaderboard") {
      const event = await prisma.event.findUnique({ where: { slug } });
      if (!event) return json({ error: "Event not found" }, 404);
      const rows = await prisma.roundResult.findMany({
        where: { round: { eventId: event.id } },
        include: { team: true, round: true },
        orderBy: { weightedTotal: "desc" },
      });
      return json(rows);
    }
  }

  return null;
}

async function handleRegistration(method: string, path: string[], request: NextRequest) {
  if (path[0] !== "events" || path.length < 3) return null;
  const slug = path[1];
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return json({ error: "Event not found" }, 404);

  if (method === "POST" && path[2] === "register") {
    const body = await readBody(request);
    const status =
      event.registrationType === "APPLICATION"
        ? RegistrationStatus.PENDING
        : event.hasWaitlist
          ? RegistrationStatus.WAITLISTED
          : RegistrationStatus.CONFIRMED;
    const registration = await prisma.registration.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: body.userId,
        },
      },
      update: {
        customAnswers: body.customAnswers,
        status,
      },
      create: {
        eventId: event.id,
        userId: body.userId,
        status,
        dietaryRestrictions: body.dietaryRestrictions,
        tshirtSize: body.tshirtSize,
        customAnswers: body.customAnswers,
      },
    });

    await emitNotification({
      userIds: [body.userId],
      eventId: event.id,
      type: "registration_confirmed",
      title: "Registration received",
      body: `You're registered for ${event.name}`,
    });

    return json(registration, 201);
  }

  if (method === "GET" && path[2] === "registrations") {
    const rows = await prisma.registration.findMany({ where: { eventId: event.id } });
    return json(rows);
  }

  if (method === "PATCH" && path[2] === "registrations" && path[3]) {
    const userId = path[3];
    const body = await readBody(request);
    const status = body.action === "approve" ? RegistrationStatus.CONFIRMED : RegistrationStatus.REJECTED;
    const row = await prisma.registration.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { status },
    });
    return json(row);
  }

  return null;
}

async function handleTeams(method: string, path: string[], request: NextRequest) {
  if (path[0] !== "events" || path[2] !== "teams") return null;
  const event = await prisma.event.findUnique({ where: { slug: path[1] } });
  if (!event) return json({ error: "Event not found" }, 404);

  if (method === "POST" && path.length === 3) {
    const body = await readBody(request);
    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        trackId: body.trackId,
        name: body.name,
        description: body.description,
        techStack: body.techStack || [],
        members: {
          create: {
            userId: body.leadUserId,
            role: "LEAD",
          },
        },
      },
      include: { members: true },
    });
    return json(team, 201);
  }

  if (method === "GET" && path.length === 3) {
    const teams = await prisma.team.findMany({
      where: { eventId: event.id },
      include: { members: { include: { user: true } }, track: true },
    });
    return json(teams);
  }

  if (method === "PATCH" && path.length === 4) {
    const body = await readBody(request);
    const team = await prisma.team.update({ where: { id: path[3] }, data: body });
    return json(team);
  }

  if (method === "POST" && path[3] === "join") {
    const body = await readBody(request);
    const team = await prisma.team.findUnique({ where: { inviteCode: body.inviteCode } });
    if (!team) return json({ error: "Invalid invite code" }, 404);
    const member = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: body.userId,
      },
    });
    return json(member, 201);
  }

  if (method === "DELETE" && path.length === 5 && path[4] === "leave") {
    const body = await readBody(request);
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: path[3], userId: body.userId } } });
    return json({ ok: true });
  }

  return null;
}

async function handleRounds(method: string, path: string[], request: NextRequest) {
  if (path[0] === "events" && path[2] === "rounds") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);

    if (method === "POST" && path.length === 3) {
      const body = await readBody(request);
      const round = await prisma.round.create({
        data: {
          eventId: event.id,
          name: body.name,
          description: body.description,
          order: body.order,
          submissionOpen: new Date(body.submissionOpen),
          submissionClose: new Date(body.submissionClose),
          judgingOpen: body.judgingOpen ? new Date(body.judgingOpen) : null,
          judgingClose: body.judgingClose ? new Date(body.judgingClose) : null,
          advancingTeams: body.advancingTeams,
          isCalibrationRequired: body.isCalibrationRequired ?? true,
        },
      });
      return json(round, 201);
    }

    if (method === "GET" && path.length === 3) {
      const rounds = await prisma.round.findMany({
        where: { eventId: event.id },
        include: { rubrics: true, judgeAssignments: true },
        orderBy: { order: "asc" },
      });
      return json(rounds);
    }

    if (method === "PATCH" && path.length === 4) {
      const body = await readBody(request);
      const round = await prisma.round.update({ where: { id: path[3] }, data: body });
      return json(round);
    }

    if (method === "POST" && path.length === 5) {
      const roundId = path[3];
      const action = path[4];
      const statusMap: Record<string, RoundStatus> = {
        "open-submissions": RoundStatus.SUBMISSIONS_OPEN,
        "close-submissions": RoundStatus.SUBMISSIONS_CLOSED,
        "open-judging": RoundStatus.JUDGING_OPEN,
        "close-judging": RoundStatus.JUDGING_CLOSED,
        "release-results": RoundStatus.RESULTS_RELEASED,
      };

      if (action === "compensate") {
        const result = await runCompensation(roundId);
        return json(result);
      }

      if (action === "advance-teams") {
        const body = await readBody(request);
        const topN = Number(body.topN || 0);
        const rows = await prisma.roundResult.findMany({
          where: { roundId },
          orderBy: { rank: "asc" },
        });
        await prisma.$transaction(
          rows.map((row, index) =>
            prisma.roundResult.update({
              where: { id: row.id },
              data: { advanced: index < topN },
            }),
          ),
        );
        return json({ ok: true });
      }

      if (statusMap[action]) {
        const round = await prisma.round.update({ where: { id: roundId }, data: { status: statusMap[action] } });
        return json(round);
      }
    }

    if (method === "GET" && path.length === 6 && path[5] === "compensation-report") {
      const report = await getCompensationReport(path[4]);
      return json(report);
    }
  }

  if (path[0] === "rounds" && path.length >= 2) {
    const roundId = path[1];

    if (method === "POST" && path[2] === "rubrics") {
      const body = await readBody(request);
      const rubric = await prisma.rubric.create({ data: { ...body, roundId } });
      return json(rubric, 201);
    }

    if (method === "PATCH" && path[2] === "rubrics" && path[3]) {
      const body = await readBody(request);
      const rubric = await prisma.rubric.update({ where: { id: path[3] }, data: body });
      return json(rubric);
    }

    if (method === "DELETE" && path[2] === "rubrics" && path[3]) {
      await prisma.rubric.delete({ where: { id: path[3] } });
      return json({ ok: true });
    }

    if (method === "POST" && path[2] === "submissions") {
      const body = await readBody(request);
      const round = await prisma.round.findUnique({ where: { id: roundId } });
      if (!round) return json({ error: "Round not found" }, 404);

      const submission = await prisma.submission.create({
        data: {
          roundId,
          eventId: round.eventId,
          teamId: body.teamId,
          submittedBy: body.submittedBy,
          status: SubmissionStatus.DRAFT,
          githubUrl: body.githubUrl,
          demoUrl: body.demoUrl,
          figmaUrl: body.figmaUrl,
          videoUrl: body.videoUrl,
          deckUrl: body.deckUrl,
          description: body.description,
          customFields: body.customFields,
        },
      });
      return json(submission, 201);
    }

    if (method === "GET" && path[2] === "submissions") {
      const submissions = await prisma.submission.findMany({ where: { roundId }, include: { files: true } });
      return json(submissions);
    }

    if (method === "PATCH" && path[2] === "submissions" && path[3]) {
      const body = await readBody(request);
      const submission = await prisma.submission.update({ where: { id: path[3] }, data: body });
      return json(submission);
    }

    if (method === "POST" && path[2] === "submissions" && path[4] === "submit") {
      const existing = await prisma.submission.findUnique({ where: { id: path[3] } });
      if (!existing) return json({ error: "Submission not found" }, 404);

      const now = new Date();
      const round = await prisma.round.findUnique({ where: { id: existing.roundId } });
      const isLate = !!round && now > round.submissionClose;
      const status = isLate ? SubmissionStatus.LATE_SUBMITTED : SubmissionStatus.SUBMITTED;

      const submission = await prisma.submission.update({
        where: { id: path[3] },
        data: {
          status,
          isLate,
          submittedAt: now,
        },
      });
      return json(submission);
    }

    if (method === "POST" && path[2] === "scores") {
      const body = await readBody(request);
      const round = await prisma.round.findUnique({ where: { id: roundId } });
      if (!round) return json({ error: "Round not found" }, 404);

      const result = await prisma.$transaction(
        body.scores.map((item: { teamId: string; judgeId: string; rubricId: string; rawScore: number; comment?: string }) =>
          prisma.score.upsert({
            where: {
              teamId_judgeId_roundId_rubricId: {
                teamId: item.teamId,
                judgeId: item.judgeId,
                roundId,
                rubricId: item.rubricId,
              },
            },
            update: {
              rawScore: item.rawScore,
              comment: item.comment,
            },
            create: {
              eventId: round.eventId,
              roundId,
              teamId: item.teamId,
              judgeId: item.judgeId,
              rubricId: item.rubricId,
              rawScore: item.rawScore,
              comment: item.comment,
            },
          }),
        ),
      );

      return json(result, 201);
    }

    if (method === "GET" && path[2] === "scores") {
      const scores = await prisma.score.findMany({ where: { roundId } });
      return json(scores);
    }

    if (method === "GET" && path[2] === "scores" && path[3] === "mine") {
      const judgeId = request.headers.get("x-user-id");
      if (!judgeId) return json({ error: "Missing x-user-id" }, 400);
      const scores = await prisma.score.findMany({ where: { roundId, judgeId } });
      return json(scores);
    }
  }

  if (path[0] === "teams" && path.length === 3 && path[2] === "submissions") {
    const rows = await prisma.submission.findMany({ where: { teamId: path[1] }, include: { round: true } });
    return json(rows);
  }

  if (path[0] === "teams" && path.length === 3 && path[2] === "scores") {
    const rows = await prisma.score.findMany({ where: { teamId: path[1] }, include: { rubric: true, round: true } });
    return json(rows);
  }

  if (path[0] === "rounds" && path.length === 3 && path[2] === "compensate" && method === "POST") {
    const result = await runCompensation(path[1]);
    return json(result);
  }

  if (path[0] === "rounds" && path.length === 3 && path[2] === "compensation-report" && method === "GET") {
    const report = await getCompensationReport(path[1]);
    return json(report);
  }

  return null;
}

async function handleAppeals(method: string, path: string[], request: NextRequest) {
  if (method === "POST" && path[0] === "appeals") {
    const body = await readBody(request);
    const appeal = await prisma.scoreAppeal.create({ data: body });
    return json(appeal, 201);
  }

  if (path[0] === "events" && path[2] === "appeals" && method === "GET") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);
    const rows = await prisma.scoreAppeal.findMany({ where: { eventId: event.id } });
    return json(rows);
  }

  if (path[0] === "appeals" && path[1] && method === "PATCH") {
    const body = await readBody(request);
    const appeal = await prisma.scoreAppeal.update({
      where: { id: path[1] },
      data: {
        status: body.status,
        resolution: body.resolution,
        resolvedAt: new Date(),
      },
    });
    return json(appeal);
  }

  return null;
}

async function handleMentorsAnnouncements(method: string, path: string[], request: NextRequest) {
  if (path[0] === "events" && path[2] === "mentors") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);
    if (method === "POST") {
      const body = await readBody(request);
      const mentor = await prisma.mentor.create({ data: { eventId: event.id, userId: body.userId, expertise: body.expertise || [] } });
      return json(mentor, 201);
    }
    if (method === "GET") {
      const mentors = await prisma.mentor.findMany({ where: { eventId: event.id }, include: { slots: true, user: true } });
      return json(mentors);
    }
  }

  if (path[0] === "mentors" && path[2] === "slots" && method === "POST") {
    const body = await readBody(request);
    const slot = await prisma.mentorSlot.create({
      data: {
        mentorId: path[1],
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        meetLink: body.meetLink,
      },
    });
    return json(slot, 201);
  }

  if (path[0] === "mentors" && path[1] === "slots" && path[3] === "book" && method === "POST") {
    const body = await readBody(request);
    const slot = await prisma.mentorSlot.update({ where: { id: path[2] }, data: { isBooked: true, teamId: body.teamId } });
    return json(slot);
  }

  if (path[0] === "events" && path[2] === "announcements") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);

    if (method === "POST") {
      const body = await readBody(request);
      const ann = await prisma.announcement.create({
        data: {
          eventId: event.id,
          title: body.title,
          body: body.body,
          isPinned: !!body.isPinned,
        },
      });
      return json(ann, 201);
    }

    if (method === "GET") {
      const rows = await prisma.announcement.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" } });
      return json(rows);
    }

    if (method === "DELETE" && path[3]) {
      await prisma.announcement.delete({ where: { id: path[3] } });
      return json({ ok: true });
    }
  }

  return null;
}

async function handleCertificatesAnalytics(method: string, path: string[], _request: NextRequest) {
  void _request;

  if (path[0] === "events" && path[2] === "certificates" && path[3] === "generate-all" && method === "POST") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);

    const regs = await prisma.registration.findMany({ where: { eventId: event.id, status: RegistrationStatus.CONFIRMED } });
    const created = [];
    for (const reg of regs) {
      const cert = await prisma.certificate.create({
        data: {
          eventId: event.id,
          userId: reg.userId,
          type: "PARTICIPANT",
        },
      });
      const user = await prisma.user.findUnique({ where: { id: reg.userId } });
      if (user) {
        await generateCertificatePdf({
          name: user.name,
          eventName: event.name,
          eventDates: `${event.startDate.toDateString()} - ${event.endDate.toDateString()}`,
          certificateType: cert.type,
          verifyCode: cert.verifyCode,
          logoUrl: event.logoUrl,
        });
      }
      created.push(cert);
    }
    return json({ created: created.length });
  }

  if (path[0] === "certificates" && path[1] && path[2] && method === "GET") {
    const cert = await prisma.certificate.findFirst({ where: { userId: path[1], eventId: path[2] } });
    return cert ? json(cert) : json({ error: "Certificate not found" }, 404);
  }

  if (path[0] === "verify" && path[1] && method === "GET") {
    const cert = await prisma.certificate.findUnique({ where: { verifyCode: path[1] } });
    return cert ? json(cert) : json({ error: "Verify code not found" }, 404);
  }

  if (path[0] === "events" && path[2] === "analytics") {
    const event = await prisma.event.findUnique({ where: { slug: path[1] } });
    if (!event) return json({ error: "Event not found" }, 404);

    if (path[3] === "overview" && method === "GET") {
      const [visits, registered, teamCount, submitted] = await Promise.all([
        prisma.webhookDelivery.count({ where: { eventId: event.id, type: "landing_view" } }),
        prisma.registration.count({ where: { eventId: event.id } }),
        prisma.team.count({ where: { eventId: event.id } }),
        prisma.submission.count({ where: { eventId: event.id, status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE_SUBMITTED] } } }),
      ]);
      return json({ visits, registered, teamCount, submitted });
    }

    if (path[3] === "scores" && method === "GET") {
      const scores = await prisma.score.findMany({ where: { eventId: event.id }, include: { rubric: true } });
      return json(scores);
    }

    if (path[3] === "submissions" && method === "GET") {
      const submissions = await prisma.submission.findMany({ where: { eventId: event.id }, include: { team: true, round: true } });
      return json(submissions);
    }

    if (path[3] === "export" && method === "GET") {
      const rows = await prisma.roundResult.findMany({
        where: { round: { eventId: event.id } },
        include: { team: true, round: true },
      });
      return json({ rows });
    }
  }

  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  const handlers = [
    handleAuth,
    handleEvents,
    handleRegistration,
    handleTeams,
    handleRounds,
    handleAppeals,
    handleMentorsAnnouncements,
    handleCertificatesAnalytics,
  ];

  for (const handler of handlers) {
    const result = await handler("GET", path, request);
    if (result) return result;
  }

  return json({ error: "Not found" }, 404);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  const handlers = [
    handleAuth,
    handleEvents,
    handleRegistration,
    handleTeams,
    handleRounds,
    handleAppeals,
    handleMentorsAnnouncements,
    handleCertificatesAnalytics,
  ];

  for (const handler of handlers) {
    const result = await handler("POST", path, request);
    if (result) return result;
  }

  return json({ error: "Not found" }, 404);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const handlers = [handleEvents, handleRegistration, handleTeams, handleRounds, handleAppeals];

  for (const handler of handlers) {
    const result = await handler("PATCH", path, request);
    if (result) return result;
  }

  return json({ error: "Not found" }, 404);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const handlers = [handleEvents, handleTeams, handleMentorsAnnouncements, handleRounds];

  for (const handler of handlers) {
    const result = await handler("DELETE", path, request);
    if (result) return result;
  }

  return json({ error: "Not found" }, 404);
}
