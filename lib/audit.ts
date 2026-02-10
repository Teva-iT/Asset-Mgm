
import { prisma } from "@/lib/db";

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    ASSIGN = "ASSIGN",
    RETURN = "RETURN",
    IMPORT = "IMPORT",
}

export async function logAudit(
    assetId: string,
    action: AuditAction | string,
    details: string,
    userId?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                AssetID: assetId,
                Action: action,
                Details: details,
                UserID: userId || null,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Do not throw, audit failure should not block main action
    }
}
