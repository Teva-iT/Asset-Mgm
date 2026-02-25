
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

// --- Audit Logging ---

export async function logOffboardingAction(
    checklistId: string,
    action: string,
    userId?: string | null,
    ipAddress?: string | null
) {
    try {
        await supabase
            .from("OffboardingAudit")
            .insert({
                ChecklistID: checklistId,
                Action: action,
                UserID: userId || null,
                IPAddress: ipAddress || null,
            });
    } catch (error) {
        console.error('Failed to log offboarding action:', error)
        // Non-blocking error logging
    }
}

// --- Secure Token Management ---

const TOKEN_EXPIRY_DAYS = 7

export async function generateSecureToken(checklistId: string) {
    const token = nanoid(32) // Long secure random string
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)

    const { data: tokenRecord } = await supabase
        .from("OffboardingToken")
        .insert({
            ChecklistID: checklistId,
            Token: token,
            ExpiresAt: expiresAt.toISOString(),
        })
        .select()
        .single();

    return tokenRecord
}

export async function validateToken(tokenString: string) {
    const { data: tokenRecord } = await supabase
        .from("OffboardingToken")
        .select("*, Checklist:OffboardingChecklist(*)")
        .eq("Token", tokenString)
        .maybeSingle();

    if (!tokenRecord) return null

    // Check expiry
    if (new Date() > new Date(tokenRecord.ExpiresAt)) {
        return null // Expired
    }

    return tokenRecord
}
