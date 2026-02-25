import { supabase } from "@/lib/supabase";

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
        await supabase.from("AuditLog").insert({
            LogID: crypto.randomUUID(),
            AssetID: assetId,
            Action: action,
            Details: details,
            UserID: userId || null,
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
