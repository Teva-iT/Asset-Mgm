import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        console.log(`Deleting Onboarding Request: ${id}`)

        // Due to ON DELETE CASCADE on the DB level, child related hardware_requests logic might cascade automatically,
        // However, access_requests might only be set to ON DELETE SET NULL if we aren't careful, so we should clean them up explicitly to be safe.
        // Or if the constraint is ON DELETE CASCADE, Supabase handles it. Let's explicitly delete just in case.

        // Pre-clean access requests linked to this onboarding
        await supabase.from('access_requests').delete().eq('onboarding_request_id', id)

        const { error } = await supabase
            .from('onboarding_requests')
            .delete()
            .eq('id', id)

        if (error) {
            console.error("Error deleting onboarding request:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Server error during deletion:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const body = await req.json()
        const { start_date, status, notes } = body

        const { data, error } = await supabase
            .from('onboarding_requests')
            .update({ start_date, status, notes, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error("Error updating onboarding request:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, onboarding: data })

    } catch (error) {
        console.error("Server error during update:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
