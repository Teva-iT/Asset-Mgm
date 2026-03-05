import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const modelId = params.id

    const [{ data: model }, { data: history }] = await Promise.all([
        supabase
            .from('AssetModel')
            .select('*, Manufacturer:ManufacturerID(Name)')
            .eq('ModelID', modelId)
            .single(),
        supabase
            .from('InventoryRecord')
            .select('*, StorageLocation:StorageLocationID(Name)')
            .eq('ModelID', modelId)
            .order('CreatedAt', { ascending: true })
    ])

    if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 })

    return NextResponse.json({ model, history: history || [] })
}
