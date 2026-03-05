import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const locationId = searchParams.get('locationId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (!modelId) {
        return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
    }

    let query = supabase
        .from('InventoryRecord')
        .select('*, StorageLocation:StorageLocationID(Name)')
        .eq('ModelID', modelId)
        .order('CreatedAt', { ascending: false })

    if (type) query = query.eq('ActionType', type)
    if (locationId) query = query.eq('StorageLocationID', locationId)
    if (fromDate) query = query.gte('CreatedAt', fromDate)
    if (toDate) query = query.lte('CreatedAt', toDate + 'T23:59:59')

    // Note: Complex full-text search across related tables is better on client 
    // or requires advanced Postgres search. We'll handle 'search' filter if it matches ActionType or Notes.
    if (search) {
        query = query.or(`ActionType.ilike.%${search}%,Notes.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
