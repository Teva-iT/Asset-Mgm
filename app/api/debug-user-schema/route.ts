import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { error } = await supabase.from('User').select('AvatarUrl').limit(1)
        if (error) {
            return NextResponse.json({
                needsMigration: true,
                error: error.message,
                sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "AvatarUrl" TEXT, ADD COLUMN IF NOT EXISTS "SupportRole" TEXT, ADD COLUMN IF NOT EXISTS "IsSupportContact" BOOLEAN DEFAULT false;`
            })
        }
        return NextResponse.json({ needsMigration: false, message: 'Columns exist' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
