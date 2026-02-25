import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data: statuses, error } = await supabase
            .from("AssetStatus")
            .select("*")
            .order("Name", { ascending: true });

        if (error) throw error;

        return NextResponse.json(statuses)
    } catch (error) {
        console.error('Error fetching statuses:', error)
        return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 })
    }
}
