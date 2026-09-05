import { prisma } from "./db";

export async function logAudit(sessionId, eventType, actor, payload = {}, explanation) {
  if (!sessionId || sessionId === "pending") {
    return null;
  }
  return prisma.auditEvent.create({
    data: {
      sessionId,
      eventType,
      actor,
      payload: JSON.stringify(payload ?? {}),
      explanation: explanation || null,
    },
  });
}

export async function getAuditTrail(sessionId) {
  return prisma.auditEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}
