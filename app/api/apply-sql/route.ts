import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const sql = fs.readFileSync(path.join(process.cwd(), 'create_assign_function.sql'), 'utf8')
        const { error } = await supabase.rpc('exec_raw_sql', { query: sql })
        if (error) {
            return NextResponse.json({ error: error.message, hint: error.hint || 'no hint' })
        }
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
