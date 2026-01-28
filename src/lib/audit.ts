import { prisma } from "@/lib/db";

export async function logAudit(args: {
  action: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  userId?: string | null;
  userEmail?: string | null;
  meta?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId ?? null,
        message: args.message,
        userId: args.userId ?? null,
        userEmail: args.userEmail ?? null,
        metaJson: args.meta ? JSON.stringify(args.meta) : null,
      },
    });
  } catch (e) {
    // never break workflow because of logging
    console.error("AuditLog failed:", e);
  }
}
