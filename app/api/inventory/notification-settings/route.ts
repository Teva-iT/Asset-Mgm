import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        if (!token) return null

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jwtVerify(token, secret)
        return payload.userId as string || null
    } catch {
        return null
    }
}

export async function GET(req: Request) {
    try {
        // Try to get userId from auth token first, fallback to query param
        let userId = await getAuthenticatedUserId()

        if (!userId) {
            // Fallback: look up by username from query param
            const { searchParams } = new URL(req.url)
            const username = searchParams.get('userId')
            if (username) {
                const { data: user } = await supabaseAdmin
                    .from('User')
                    .select('UserID')
                    .eq('Username', username)
                    .maybeSingle()
                userId = user?.UserID || null
            }
        }

        if (!userId) return NextResponse.json({})

        const { data, error } = await supabaseAdmin
            .from('InventoryNotificationSetting')
            .select('*')
            .eq('UserID', userId)
            .maybeSingle()

        if (error) throw error
        return NextResponse.json(data || {})
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        // Get authenticated user's real UUID
        let userId = await getAuthenticatedUserId()

        const body = await req.json()
        const { emailEnabled, systemEnabled, alertFrequency, recipients } = body

        // If no auth token, try to lookup by username passed in body
        if (!userId && body.userId) {
            const { data: user } = await supabaseAdmin
                .from('User')
                .select('UserID')
                .eq('Username', body.userId)
                .maybeSingle()
            userId = user?.UserID || null
        }

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { data, error } = await supabaseAdmin
            .from('InventoryNotificationSetting')
            .upsert({
                UserID: userId,
                EmailEnabled: emailEnabled,
                SystemEnabled: systemEnabled,
                AlertFrequency: alertFrequency || 'Once',
                Recipients: recipients,
                UpdatedAt: new Date().toISOString()
            }, { onConflict: 'UserID' })
            .select()

        if (error) throw error
        return NextResponse.json(data?.[0] || {})
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
