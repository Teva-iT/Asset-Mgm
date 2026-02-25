import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { outcome, method, query, assetId, assetStatus } = body

        // --- Auth Check ---
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let userId: string | null = null

        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
                const { payload } = await jwtVerify(token, secret)
                if (typeof payload.userId === 'string') {
                    userId = payload.userId
                }
            } catch (e) {
                // Token invalid, log as anonymous or system?
                console.warn('Scan History: Invalid token', e)
            }
        }

        // --- Create Log Entry ---
        const { data: scan, error } = await supabase.from("ScanHistory").insert({
            ScanID: crypto.randomUUID(),
            Outcome: outcome,
            Method: method,
            Query: query,
            AssetID: assetId || null,
            CalculatedStatus: assetStatus || null,
            ScannedByUserID: userId
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, scanId: scan.ScanID })
    } catch (error) {
        console.error('Failed to log scan history:', error)
        return NextResponse.json({ error: 'Failed to log scan' }, { status: 500 })
    }
}
