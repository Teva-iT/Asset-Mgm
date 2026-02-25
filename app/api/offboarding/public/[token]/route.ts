import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateToken, logOffboardingAction } from '@/lib/offboarding'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const resolvedParams = await params;
    try {
        const tokenRecord = await validateToken(resolvedParams.token)

        if (!tokenRecord) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        const { data: checklist, error } = await supabase
            .from("OffboardingChecklist")
            .select("*, Employee(FirstName, LastName, Email)")
            .eq("ChecklistID", tokenRecord.ChecklistID)
            .single();

        if (error || !checklist) {
            return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
        }

        return NextResponse.json(checklist)

    } catch (error) {
        console.error('Error fetching public checklist:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const resolvedParams = await params;
    try {
        const tokenRecord = await validateToken(resolvedParams.token)

        if (!tokenRecord) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        const body = await request.json()
        const { checklistData } = body

        // Only allow updating checklistData and Status
        // Status -> 'Submitted' automatically

        const { error: updateError } = await supabase.from("OffboardingChecklist").update({
            ChecklistData: checklistData,
            Status: 'Submitted',
            updatedAt: new Date().toISOString()
        }).eq("ChecklistID", tokenRecord.ChecklistID);

        if (updateError) throw updateError;

        // Audit Log
        await logOffboardingAction(tokenRecord.ChecklistID, 'Submitted', null, request.headers.get('x-forwarded-for') || '::1')

        await supabase.from("OffboardingToken").update({ Used: true, updatedAt: new Date().toISOString() }).eq("TokenID", tokenRecord.TokenID);

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error submitting public checklist:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
