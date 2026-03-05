import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    // Add ReorderLevel column to AssetModel
    // Note: Supabase doesn't support raw DDL via REST. We do this via RPC or check existence.
    // Instead, we'll try to select ReorderLevel to see if it exists
    const { data, error } = await supabase.from('AssetModel').select('ReorderLevel').limit(1)
    if (error && error.message.includes('column')) {
        return NextResponse.json({ exists: false, message: 'ReorderLevel column does not exist. Please run the migration SQL in Supabase Studio.' })
    }
    return NextResponse.json({ exists: true, message: 'ReorderLevel column exists!' })
}
