import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("AssetModel")
            .select("ModelID, Name, Category")
            .order('Name', { ascending: true })

        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
