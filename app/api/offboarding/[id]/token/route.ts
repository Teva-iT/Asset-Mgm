import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { generateSecureToken, logOffboardingAction } from '@/lib/offboarding'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.role !== 'ADMIN') { }

        const checklistId = resolvedParams.id
        const { data: checklist } = await supabase.from("OffboardingChecklist").select("*").eq("ChecklistID", checklistId).single();

        if (!checklist) {
            return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
        }

        // Generate Token
        // This helper creates the OffboardingToken record in DB
        const tokenRecord = await generateSecureToken(checklistId)

        // Update Status to 'Sent' if it was 'Draft'
        if (checklist.Status === 'Draft') {
            await supabase.from("OffboardingChecklist").update({ Status: 'Sent' }).eq("ChecklistID", checklistId)
        }

        // Audit Log
        await logOffboardingAction(checklistId, 'Sent', user.userId, request.headers.get('x-forwarded-for') || '::1')

        // Construct Public URL
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const host = request.headers.get('host')
        const publicUrl = `${protocol}://${host}/offboarding/public/${tokenRecord.Token}`

        return NextResponse.json({
            token: tokenRecord.Token,
            url: publicUrl,
            expiresAt: tokenRecord.ExpiresAt
        })

    } catch (error) {
        console.error('Error generating token:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
