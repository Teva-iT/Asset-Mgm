import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { employeeId, status, items } = body

        // --- Auth Check ---
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let currentUser: any = null

        if (token) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            try {
                const { payload } = await jose.jwtVerify(token, secret)
                currentUser = payload as any
            } catch (e) {
                // Ignore expired token here, just fallback
            }
        }

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!employeeId) {
            return NextResponse.json({ error: 'Employee is required' }, { status: 400 })
        }

        // 1. Create main request record
        const { data: requestRecord, error: requestError } = await supabase
            .from('access_requests')
            .insert({
                employee_id: employeeId,
                created_by: currentUser.id,
                status: status || 'Draft',
                submitted_at: status === 'Submitted' ? new Date().toISOString() : null
            })
            .select()
            .single() as { data: any, error: any }

        if (requestError) throw requestError

        // 2. Insert Items (Snapshot)
        if (items && Array.isArray(items) && items.length > 0) {
            const itemsToInsert = items.map((item: any) => ({
                access_request_id: requestRecord?.id,
                section_name: item.section_name,
                field_name: item.field_name,
                field_type: item.field_type,
                value: item.value,
                justification: item.justification || null
            }))

            const { error: itemsError } = await supabase
                .from('access_request_items')
                .insert(itemsToInsert)

            if (itemsError) {
                console.error("Error inserting items:", itemsError)
                // We should ideally rollback, but Supabase JS doesn't support interactive transactions yet easily.
                // For MVP, we pass.
                throw itemsError
            }
        }

        // 3. Log Status creation
        await supabase.from('access_request_status_logs').insert({
            access_request_id: requestRecord?.id,
            changed_by: currentUser.id,
            old_status: null,
            new_status: status || 'Draft',
            comments: 'Initial creation'
        })

        return NextResponse.json({ success: true, id: requestRecord.id })

    } catch (error: any) {
        console.error('Access Request Creation Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
