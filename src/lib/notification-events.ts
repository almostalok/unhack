import { prisma } from "@/lib/prisma";

type NotifyPayload = {
  userIds: string[];
  eventId?: string;
  type: string;
  title: string;
  body: string;
};

export async function emitNotification(payload: NotifyPayload) {
  if (!payload.userIds.length) return;

  await prisma.notification.createMany({
    data: payload.userIds.map((userId) => ({
      userId,
      eventId: payload.eventId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
    })),
  });
}
