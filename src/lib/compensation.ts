import { prisma } from "@/lib/prisma";

type JudgeStats = {
  judgeId: string;
  judgeMean: number;
  judgeStdDev: number;
  biasIndex: number;
};

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = avg(values);
  const variance = avg(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function runCompensation(roundId: string) {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      rubrics: true,
      scores: {
        where: { isCalibration: false },
      },
    },
  });

  if (!round) {
    throw new Error("Round not found");
  }

  const byJudge = new Map<string, number[]>();
  for (const score of round.scores) {
    const list = byJudge.get(score.judgeId) || [];
    list.push(score.rawScore);
    byJudge.set(score.judgeId, list);
  }

  const judgeStats = new Map<string, JudgeStats>();
  for (const [judgeId, scores] of byJudge.entries()) {
    const judgeMean = avg(scores);
    const judgeStd = stdDev(scores);
    judgeStats.set(judgeId, {
      judgeId,
      judgeMean,
      judgeStdDev: judgeStd,
      biasIndex: 0,
    });
  }

  const judgeMeans = [...judgeStats.values()].map((item) => item.judgeMean);
  const judgeStdDevs = [...judgeStats.values()].map((item) => item.judgeStdDev);
  const globalMean = avg(judgeMeans);
  const globalStdDev = avg(judgeStdDevs.filter((value) => value > 0)) || 1;

  for (const [judgeId, stat] of judgeStats.entries()) {
    judgeStats.set(judgeId, {
      ...stat,
      biasIndex: globalStdDev ? (stat.judgeMean - globalMean) / globalStdDev : 0,
    });
  }

  const rubricById = new Map(round.rubrics.map((rubric) => [rubric.id, rubric]));
  const totalWeight = round.rubrics.reduce((sum, rubric) => sum + rubric.weight, 0) || 1;

  const teamJudgeRubricTotals = new Map<string, number[]>();
  const normalizedMutations: Array<{ id: string; normalizedScore: number; zScore: number }> = [];

  for (const score of round.scores) {
    const stat = judgeStats.get(score.judgeId);
    const rubric = rubricById.get(score.rubricId);
    if (!stat || !rubric) continue;

    const zScore =
      stat.judgeStdDev === 0 ? 0 : (score.rawScore - stat.judgeMean) / stat.judgeStdDev;
    const normalized =
      stat.judgeStdDev === 0
        ? globalMean
        : clamp(globalMean + zScore * globalStdDev, 0, rubric.maxScore);

    normalizedMutations.push({ id: score.id, normalizedScore: normalized, zScore });

    const key = `${score.teamId}:${score.judgeId}`;
    const list = teamJudgeRubricTotals.get(key) || [];
    list.push((normalized * rubric.weight) / totalWeight);
    teamJudgeRubricTotals.set(key, list);
  }

  await prisma.$transaction(
    normalizedMutations.map((mutation) =>
      prisma.score.update({
        where: { id: mutation.id },
        data: {
          normalizedScore: mutation.normalizedScore,
          zScore: mutation.zScore,
        },
      }),
    ),
  );

  const teamAggregates = new Map<string, { raw: number[]; normalized: number[]; judges: Set<string> }>();
  for (const score of round.scores) {
    const item = teamAggregates.get(score.teamId) || {
      raw: [],
      normalized: [],
      judges: new Set<string>(),
    };
    item.raw.push(score.rawScore);
    item.normalized.push(score.normalizedScore ?? score.rawScore);
    item.judges.add(score.judgeId);
    teamAggregates.set(score.teamId, item);
  }

  const rows = [...teamAggregates.entries()].map(([teamId, data]) => {
    const rawTotal = avg(data.raw);
    const compensatedTotal = avg(data.normalized);
    return {
      teamId,
      rawTotal,
      compensatedTotal,
      weightedTotal: compensatedTotal,
      judgeCoverage: data.judges.size,
    };
  });

  rows.sort((a, b) => b.weightedTotal - a.weightedTotal);

  const totalTeams = rows.length || 1;
  const resultRows = rows.map((item, index) => {
    const teamsBelow = totalTeams - (index + 1);
    return {
      ...item,
      rank: index + 1,
      percentile: (teamsBelow / totalTeams) * 100,
      lowCoverageFlag: item.judgeCoverage === 1,
    };
  });

  await prisma.$transaction([
    prisma.roundResult.deleteMany({ where: { roundId } }),
    prisma.roundResult.createMany({
      data: resultRows.map((item) => ({
        teamId: item.teamId,
        roundId,
        rawTotal: item.rawTotal,
        compensatedTotal: item.compensatedTotal,
        weightedTotal: item.weightedTotal,
        rank: item.rank,
        percentile: item.percentile,
        advanced: false,
        lowCoverageFlag: item.lowCoverageFlag,
      })),
    }),
  ]);

  return {
    roundId,
    globalMean,
    globalStdDev,
    judgeStats: [...judgeStats.values()],
    results: resultRows,
  };
}

export async function getCompensationReport(roundId: string) {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      scores: true,
      roundResults: {
        include: {
          team: true,
        },
      },
    },
  });

  if (!round) {
    throw new Error("Round not found");
  }

  const byJudge = new Map<string, number[]>();
  for (const score of round.scores) {
    if (score.isCalibration) continue;
    const list = byJudge.get(score.judgeId) || [];
    list.push(score.rawScore);
    byJudge.set(score.judgeId, list);
  }

  const stats = [...byJudge.entries()].map(([judgeId, values]) => ({
    judgeId,
    judgeMean: avg(values),
    judgeStdDev: stdDev(values),
  }));

  const baselineMean = avg(stats.map((item) => item.judgeMean));
  const baselineStdDev = avg(stats.map((item) => item.judgeStdDev).filter((value) => value > 0)) || 1;

  const judges = stats.map((item) => ({
    ...item,
    biasIndex: (item.judgeMean - baselineMean) / baselineStdDev,
    flagged: Math.abs((item.judgeMean - baselineMean) / baselineStdDev) > 1.5,
  }));

  return {
    roundId,
    baseline: {
      globalMean: baselineMean,
      globalStdDev: baselineStdDev,
    },
    judges,
    leaderboardBefore: round.roundResults
      .map((row) => ({ team: row.team.name, score: row.rawTotal }))
      .sort((a, b) => b.score - a.score),
    leaderboardAfter: round.roundResults
      .map((row) => ({ team: row.team.name, score: row.compensatedTotal }))
      .sort((a, b) => b.score - a.score),
  };
}
