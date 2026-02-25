import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    try {
        // Search by Serial Number OR Device Tag OR Asset Name
        const { data: assets, error } = await supabase
            .from("Asset")
            .select(`
                *,
                assignments:Assignment (
                    *,
                    Employee:EmployeeID (*)
                )
            `)
            .or(`SerialNumber.ilike.%${query}%,DeviceTag.ilike.%${query}%,AssetName.ilike.%${query}%`)
            .limit(1);

        if (error) throw error;

        const asset = assets && assets.length > 0 ? assets[0] : null;

        if (!asset) {
            return NextResponse.json({ found: false })
        }

        if (asset.assignments) {
            asset.assignments = asset.assignments.filter((a: any) => a.Status === 'Active');
        }

        return NextResponse.json({ found: true, asset })
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Failed to search asset' }, { status: 500 })
    }
}
