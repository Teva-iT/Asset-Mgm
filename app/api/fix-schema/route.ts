import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ success: false, logs: ["Schema management is now handled via Supabase migrations. This endpoint is disabled."] })
}
