import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 0 // always fetch live

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('distribution_lists')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) {
            console.error('Supabase error fetching distribution lists:', error)
            return NextResponse.json({ error: 'Failed to fetch distribution lists' }, { status: 500 })
        }

        return NextResponse.json({ distribution_lists: data })
    } catch (err: any) {
        console.error('Unexpected error fetching distribution lists:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
