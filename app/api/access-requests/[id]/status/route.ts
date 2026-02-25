import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status, comments } = body

        // --- Auth Check ---
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let currentUser: any = null

        if (token) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            try {
                const { payload } = await jose.jwtVerify(token, secret)
                currentUser = payload as any
            } catch (e) { }
        }

        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Fetch current request
        const { data: currentReq, error: fetchError } = await supabase
            .from('access_requests')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !currentReq) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        const oldStatus = currentReq.status

        // Validate state transition basics
        if (oldStatus === 'Completed' || oldStatus === 'Rejected') {
            return NextResponse.json({ error: 'Cannot change status of a finalized request' }, { status: 400 })
        }

        // Add enforcement: Rejections MUST have a reason
        if (status === 'Rejected' && (!comments || comments.trim() === '')) {
            return NextResponse.json({ error: 'A reason must be provided when rejecting a request.' }, { status: 400 })
        }

        // 2. Determine timestamps to update
        const updates: any = { status, updated_at: new Date().toISOString() }

        if (status === 'Approved') updates.approved_at = new Date().toISOString()

        // Finalize only on Complete or Reject. "Partially Completed" is still in progress.
        if (status === 'Completed' || status === 'Rejected') updates.finalized_at = new Date().toISOString()

        if (status === 'Submitted' && oldStatus === 'Draft') updates.submitted_at = new Date().toISOString()

        // 3. Update the request
        const { error: updateError } = await supabase
            .from('access_requests')
            .update(updates)
            .eq('id', id)

        if (updateError) throw updateError

        // 4. Log the transition
        await supabase.from('access_request_status_logs').insert({
            access_request_id: id,
            changed_by: currentUser.id,
            old_status: oldStatus,
            new_status: status,
            comments: comments || null
        })

        return NextResponse.json({ success: true, newStatus: status })

    } catch (error: any) {
        console.error('Status transition error:', error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}
