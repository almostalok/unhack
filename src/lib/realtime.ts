import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

const pub = redisUrl ? new Redis(redisUrl) : null;
const sub = redisUrl ? new Redis(redisUrl) : null;

export const realtimeEvents = {
  scoring_progress_updated: "scoring_progress_updated",
  leaderboard_updated: "leaderboard_updated",
  announcement_posted: "announcement_posted",
  submission_received: "submission_received",
  round_status_changed: "round_status_changed",
  results_released: "results_released",
} as const;

export type RealtimeEventName = keyof typeof realtimeEvents;

export async function publishEvent(room: string, event: RealtimeEventName, payload: unknown) {
  if (!pub) return;
  await pub.publish(
    `room:${room}`,
    JSON.stringify({
      event,
      payload,
      at: new Date().toISOString(),
    }),
  );
}

export async function subscribeRoom(room: string, cb: (event: RealtimeEventName, payload: unknown) => void) {
  if (!sub) return () => undefined;

  const channel = `room:${room}`;
  await sub.subscribe(channel);

  const onMessage = (_channel: string, message: string) => {
    const parsed = JSON.parse(message) as { event: RealtimeEventName; payload: unknown };
    cb(parsed.event, parsed.payload);
  };

  sub.on("message", onMessage);

  return async () => {
    sub.off("message", onMessage);
    await sub.unsubscribe(channel);
  };
}
