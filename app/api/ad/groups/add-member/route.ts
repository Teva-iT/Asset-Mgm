import { NextResponse } from 'next/server'
import { addADUserToGroup } from '@/lib/ad'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function POST(request: Request) {
    try {
        // --- Strict Auth & Role Check ---
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

        // IT Approval Gate Logic - Only Admins or designated IT staff should execute AD Writes
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Forbidden: Insufficient privileges to alter AD.' }, { status: 403 })
        }

        const body = await request.json()
        const { userDn, groupDn, requestId } = body

        if (!userDn || !groupDn) {
            return NextResponse.json({ error: 'Missing userDn or groupDn' }, { status: 400 })
        }

        // Execute Differential AD Write
        const success = await addADUserToGroup(userDn, groupDn)

        if (success) {
            // For MVP, we log the action locally or expect the caller to log to ad_provisioning_logs. 
            // Phase 3.4 will handle writing this to Supabase immediately afterwards.

            return NextResponse.json({ success: true, message: `Added ${userDn} to ${groupDn}` })
        } else {
            return NextResponse.json({ error: 'Failed to apply AD mutation' }, { status: 500 })
        }

    } catch (error: any) {
        console.error('API /ad/groups/add-member error:', error)
        return NextResponse.json({ error: error.message || 'AD Write Execution failed' }, { status: 500 })
    }
}
