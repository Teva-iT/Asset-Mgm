import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: All requests (admin sees all, otherwise filter by user)
export async function GET(request: NextRequest) {
    try {
        const status = request.nextUrl.searchParams.get('status')
        let query = supabase
            .from('AssetRequest')
            .select('*, Employee:EmployeeID(FirstName, LastName, Department, Email), ReviewedBy:ReviewedByID(Username), FulfilledAsset:FulfilledAssetID(AssetName, SerialNumber, AssetType)')
            .order('createdAt', { ascending: false })

        if (status) query = query.eq('Status', status)

        const { data, error } = await query
        if (error) throw error
        return NextResponse.json(data || [])
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}

// POST: Submit a new asset request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { EmployeeID, AssetType, Reason, Urgency, NeededByDate } = body

        if (!EmployeeID || !AssetType || !Reason) {
            return NextResponse.json({ error: 'EmployeeID, AssetType, and Reason are required' }, { status: 400 })
        }

        const { data, error } = await supabase.from('AssetRequest').insert({
            RequestID: crypto.randomUUID(),
            EmployeeID,
            AssetType,
            Reason,
            Urgency: Urgency || 'Normal',
            NeededByDate: NeededByDate ? new Date(NeededByDate).toISOString() : null,
            Status: 'Pending',
            updatedAt: new Date().toISOString(),
        }).select().single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('AssetRequest POST error:', error)
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }
}
